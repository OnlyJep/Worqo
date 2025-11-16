import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Headerz from "./Headerz";
import Footer from '../FooterContent/footer';

const Notif = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // Track active tab: 'all' or 'unread'
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData?.id || userData?.user?.id;
      if (!userId) return;

      const response = await axios.get(`/api/users/${userId}`);
      if (response.data.success) {
        setUserProfile(response.data.user || response.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData?.id || userData?.user?.id;
      if (!userId) { setLoading(false); return; }

      const response = await axios.get(`/api/notifications?user_id=${userId}`);

      if (response.data.success) {
        setNotifications(response.data.notifications);
        // Dispatch event to update header badge
        window.dispatchEvent(new CustomEvent('notificationUpdated'));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if address is complete
  const isAddressComplete = userProfile?.profile?.street && userProfile?.profile?.contact_number;
  
  // Check worker profile review status
  const workerProfileStatus = userProfile?.worker?.is_reviewed || 'TO BE REVIEWED';

  // Generate system notifications
  const generateSystemNotifications = () => {
    const systemNotifications = [];
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = userData?.id || userData?.user?.id;
    
    // Address completion notification - Updated format
    if (!isAddressComplete) {
      systemNotifications.push({
        id: 'system-address-' + userId,
        user: 'WORQO Job Portal',
        action: 'Welcome to WORQO',
        message: 'Welcome to WORQO! We\'re excited to have you onboard. Complete your profile to get started.',
        time: '2 minutes ago',
        isUnread: true,
        profile_img: 'images/system-icon.svg',
        type: 'address',
        isSystem: true
      });
    }
    
    // Worker profile review notifications
    if (userProfile?.role_id === 1 && userProfile?.worker) { // Worker role
      if (workerProfileStatus === 'TO BE REVIEWED') {
        systemNotifications.push({
          id: 'system-review-pending-' + userId,
          user: 'System',
          action: 'Profile Review Pending',
          message: 'Please wait while your worker profile is being reviewed by WORQO Job Portal.',
          time: 'Just now',
          isUnread: true,
          profile_img: 'images/system-icon.svg',
          type: 'review',
          isSystem: true
        });
      } else if (workerProfileStatus === 'ACCEPTED') {
        systemNotifications.push({
          id: 'system-review-approved-' + userId,
          user: 'System',
          action: 'Profile Approved',
          message: 'Congratulations! Your worker profile has been approved by WORQO Job Portal.',
          time: 'Just now',
          isUnread: true,
          profile_img: 'images/system-icon.svg',
          type: 'review-approved',
          isSystem: true
        });
      } else if (workerProfileStatus === 'DECLINED') {
        systemNotifications.push({
          id: 'system-review-declined-' + userId,
          user: 'System',
          action: 'Profile Declined',
          message: 'Unfortunately, your worker profile has been declined by WORQO Job Portal. Please review and update your information.',
          time: 'Just now',
          isUnread: true,
          profile_img: 'images/system-icon.svg',
          type: 'review-declined',
          isSystem: true
        });
      }
    }
    
    return systemNotifications;
  };

  const unreadCount = notifications.filter(notif => notif.isUnread).length;

  const handleMarkAsRead = async (notifId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData?.id || userData?.user?.id;
      await axios.put(`/api/notifications/${notifId}/read`, {}, { headers: { 'X-User-Id': userId } });
      
      setNotifications(notifications.map(notif =>
        notif.id === notifId ? { ...notif, isUnread: false } : notif
      ));
      setIsModalOpen(false);
      // Dispatch event to update header badge
      window.dispatchEvent(new CustomEvent('notificationUpdated'));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAsUnread = async (notifId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData?.id || userData?.user?.id;
      await axios.put(`/api/notifications/${notifId}/unread`, {}, { headers: { 'X-User-Id': userId } });
      
      setNotifications(notifications.map(notif =>
        notif.id === notifId ? { ...notif, isUnread: true } : notif
      ));
      setIsModalOpen(false);
      // Dispatch event to update header badge
      window.dispatchEvent(new CustomEvent('notificationUpdated'));
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = userData?.id || userData?.user?.id;
      await axios.put(`/api/notifications/mark-all-read`, {}, { headers: { 'X-User-Id': userId } });
      
      setNotifications(notifications.map(notif => ({ ...notif, isUnread: false })));
      // Dispatch event to update header badge
      window.dispatchEvent(new CustomEvent('notificationUpdated'));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleCheckboxChange = (notifId) => {
    setSelectedNotifications(prev =>
      prev.includes(notifId)
        ? prev.filter(id => id !== notifId)
        : [...prev, notifId]
    );
  };

  const openModal = (notif) => {
    setSelectedNotif(notif);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNotif(null);
  };

  // Combine system notifications with API notifications
  const allNotifications = [...generateSystemNotifications(), ...notifications];
  
  const displayedNotifications = activeTab === 'unread'
    ? allNotifications.filter(notif => notif.isUnread)
    : allNotifications;

  return (
    <>
      <Headerz />
      <div className="notifications-layout">
        <div className="notifications-sidebar">
          <div className="sidebar-header">
            <h3>Notifications</h3>
          </div>
          <div className="sidebar-nav">
            <div 
              className={`nav-item ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
              <span>All Notifications</span>
              </div>
              <div 
              className={`nav-item ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
              <span>Unread Notifications</span>
                {unreadCount > 0 && (
                <span className="unread-count-badge">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          
        <div className="notifications-main">
          <div className="main-header">
            <h2>
                {activeTab === 'all' ? 'All Notifications' : 'Unread Notifications'}
              </h2>
              {displayedNotifications.some(notif => notif.isUnread) && (
              <div className="header-actions">
                <button onClick={handleMarkAllAsRead}>
                  Mark All as Read
                </button>
              </div>
              )}
            </div>
            
          <div className="main-content">
            {loading ? (
              <div className="no-notifications">
                <p>Loading notifications...</p>
              </div>
            ) : displayedNotifications.length > 0 ? (
              <div className="notifications-list">
                {displayedNotifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`notification-item ${notif.isUnread ? 'unread' : 'read'}`}
                  >
                    <div className="notification-icon">
                      {notif.isUnread ? '' : '✓'}
                    </div>
                    <div className="notification-content" onClick={() => openModal(notif)}>
                      <div className="notification-header">
                        <h3 className="notification-title">
                      {notif.user} - {notif.action}
                        </h3>
                        <span className="notification-time">
                      {notif.time}
                        </span>
                      </div>
                      <p className="notification-message">
                      {notif.message}
                    </p>
                    {notif.target_role_id && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        <span style={{ color: '#333' }}>Want to view this booking request? </span>
                        <a
                          href="#"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/profile-settings/bookings');
                          }}
                          style={{ color: '#1a73e8', textDecoration: 'underline' }}
                        >
                          Click here
                        </a>
                      </p>
                    )}
                    {notif.type === 'address' && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        <span style={{ color: '#333' }}>Complete your address: </span>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate('/profile-settings/addresses');
                          }}
                          style={{ color: '#1a73e8', textDecoration: 'underline' }}
                        >
                          Click here
                        </a>
                      </p>
                    )}
                  </div>
                    <div className="notification-actions">
                      {!notif.isSystem && (
                        <>
                          {notif.isUnread ? (
                            <button 
                              className="mark-read-btn"
                              onClick={() => handleMarkAsRead(notif.id)}
                              title="Mark as Read"
                            >
                              ✓
                            </button>
                          ) : (
                            <button 
                              className="mark-unread-btn"
                              onClick={() => handleMarkAsUnread(notif.id)}
                              title="Mark as Unread"
                            >
                              ↻
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                </div>
            ) : (
                <div className="no-notifications">
                <div className="no-notifications-illustration">
                  <div className="illustration-container">
                    <div className="envelope"></div>
                    <div className="paper-plane"></div>
                  </div>
                </div>
                <h3>No {activeTab === 'unread' ? 'Unread' : ''} Notifications Yet.</h3>
                <p>You're all caught up! No {activeTab === 'unread' ? 'unread' : 'new'} notifications to show.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && selectedNotif && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            width: '500px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <h3 style={{ margin: 0 }}>Notification</h3>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <img 
                  src={selectedNotif.profile_img && selectedNotif.profile_img.startsWith('images/') ? `${window.location.origin}/${selectedNotif.profile_img}` : (selectedNotif.profile_img ? `${window.location.origin}/storage/${selectedNotif.profile_img}` : `${window.location.origin}/images/defpfp.svg`)} 
                  alt={selectedNotif.user} 
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '50%', 
                    marginRight: '1rem',
                    objectFit: 'cover'
                  }}
                  onError={(e) => { e.target.src = `${window.location.origin}/images/defpfp.svg`; }}
                />
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedNotif.user}</p>
                  <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '0.9rem' }}>
                    {selectedNotif.time}
                  </p>
                </div>
              </div>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#333' }}>{selectedNotif.action}</h4>
              <p style={{ margin: '1rem 0', lineHeight: '1.6' }}>{selectedNotif.message}</p>
            </div>
            <div className="modal-footer">
              {/* Special actions for system notifications */}
              {selectedNotif.type === 'address' && (
                <button
                  onClick={() => {
                    closeModal();
                    navigate('/profile-settings/addresses');
                  }}
                  className="notification-action-btn"
                >
                  Complete Address Now
                </button>
              )}
              
              {selectedNotif.type === 'review' && (
                <button
                  onClick={() => {
                    closeModal();
                    navigate('/profile-settings');
                  }}
                  className="notification-action-btn"
                >
                  View Profile Status
                </button>
              )}
              
              {(selectedNotif.type === 'review-approved' || selectedNotif.type === 'review-declined') && (
                <button
                  onClick={() => {
                    closeModal();
                    navigate('/profile-settings');
                  }}
                  className="notification-action-btn"
                >
                  View Profile
                </button>
              )}
              
              {selectedNotif.isUnread && !selectedNotif.isSystem ? (
                <button
                  onClick={() => handleMarkAsRead(selectedNotif.id)}
                  className="notification-primary-btn"
                >
                  Mark as Read
                </button>
              ) : !selectedNotif.isSystem ? (
                <button
                  onClick={() => handleMarkAsUnread(selectedNotif.id)}
                  className="notification-secondary-btn"
                >
                  Mark as Unread
                </button>
              ) : null}
              <button
                onClick={closeModal}
                className="notification-secondary-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Notif;