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

      const response = await axios.get(`http://127.0.0.1:8000/api/users/${userId}`);
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

      const response = await axios.get(`http://127.0.0.1:8000/api/notifications?user_id=${userId}`);

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
      await axios.put(`http://127.0.0.1:8000/api/notifications/${notifId}/read`, {}, { headers: { 'X-User-Id': userId } });
      
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
      await axios.put(`http://127.0.0.1:8000/api/notifications/${notifId}/unread`, {}, { headers: { 'X-User-Id': userId } });
      
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
      await axios.put('http://127.0.0.1:8000/api/notifications/mark-all-read', {}, { headers: { 'X-User-Id': userId } });
      
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
      <div style={{ 
        marginTop: '80px', 
        padding: '2rem',
        minHeight: 'calc(100vh - 80px)',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ 
          display: 'flex',
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            width: '280px',
            backgroundColor: 'white',
            borderRight: '1px solid #e0e0e0',
            padding: '2rem 0'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', padding: '0 2rem' }}>Notifications</h3>
            <div style={{ padding: '0 2rem' }}>
              <div 
                style={{ 
                  padding: '1rem',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'all' ? '#e3f2fd' : 'transparent',
                  borderRight: activeTab === 'all' ? '3px solid #00C4CC' : 'none'
                }}
                onClick={() => setActiveTab('all')}
              >
                All Notifications
              </div>
              <div 
                style={{ 
                  padding: '1rem',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'unread' ? '#e3f2fd' : 'transparent',
                  borderRight: activeTab === 'unread' ? '3px solid #00C4CC' : 'none',
                  position: 'relative'
                }}
                onClick={() => setActiveTab('unread')}
              >
                Unread Notifications
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    right: '1rem',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#ff0000',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div style={{ flex: 1, padding: '0 2rem' }}>
            <div style={{ 
              backgroundColor: '#1A2A44',
              color: 'white',
              padding: '2rem',
              marginBottom: '1rem',
              borderRadius: '10px 10px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0 }}>
                {activeTab === 'all' ? 'All Notifications' : 'Unread Notifications'}
              </h2>
              {displayedNotifications.some(notif => notif.isUnread) && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    backgroundColor: '#00C4CC',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Mark All as Read
                </button>
              )}
            </div>
            
            {loading ? (
              <div style={{ 
                textAlign: 'center',
                padding: '4rem 2rem',
                backgroundColor: 'white',
                borderRadius: '0 0 10px 10px'
              }}>
                <p>Loading notifications...</p>
              </div>
            ) : displayedNotifications.length > 0 ? (
              displayedNotifications.map((notif) => (
                <div key={notif.id} style={{ 
                  backgroundColor: notif.isUnread ? '#f0faff' : 'white',
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  border: notif.isUnread ? '1px solid #00C4CC' : '1px solid #e0e0e0'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notif.id)}
                    onChange={() => handleCheckboxChange(notif.id)}
                    style={{ marginRight: '1rem' }}
                    disabled={notif.isSystem} // Disable checkbox for system notifications
                  />
                  <img 
                    src={notif.profile_img && notif.profile_img.startsWith('images/') ? notif.profile_img : (notif.profile_img ? `http://127.0.0.1:8000/storage/${notif.profile_img}` : 'images/defpfp.svg')} 
                    alt={notif.user} 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      marginRight: '1rem',
                      objectFit: 'cover'
                    }} 
                    onError={(e) => { e.target.src = 'images/defpfp.svg'; }}
                  />
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openModal(notif)}>
                    <p style={{ margin: '0', fontWeight: notif.isUnread ? 'bold' : 'normal' }}>
                      {notif.user} - {notif.action}
                    </p>
                    <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '0.9rem' }}>
                      {notif.time}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                      {notif.message}
                    </p>
                    {notif.target_role_id && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        <span style={{ color: '#333' }}>Want to view this booking? </span>
                        <a
                          href="#"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Dispatch event to handle the special link with role switching
                            window.dispatchEvent(new CustomEvent('notificationLinkClicked', {
                              detail: {
                                url: '/profile-settings/bookings',
                                targetRoleId: notif.target_role_id
                              }
                            }));
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
                            // Navigate to address settings
                            navigate('/profile-settings/addresses');
                          }}
                          style={{ color: '#1a73e8', textDecoration: 'underline' }}
                        >
                          Click here
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: 'center',
                padding: '4rem 2rem',
                backgroundColor: 'white',
                borderRadius: '0 0 10px 10px'
              }}>
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
                  src={selectedNotif.profile_img && selectedNotif.profile_img.startsWith('images/') ? selectedNotif.profile_img : (selectedNotif.profile_img ? `http://127.0.0.1:8000/storage/${selectedNotif.profile_img}` : 'images/defpfp.svg')} 
                  alt={selectedNotif.user} 
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '50%', 
                    marginRight: '1rem',
                    objectFit: 'cover'
                  }}
                  onError={(e) => { e.target.src = 'images/defpfp.svg'; }}
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
              
              {/* Special actions for system notifications */}
              {selectedNotif.type === 'address' && (
                <button
                  onClick={() => {
                    closeModal();
                    navigate('/profile-settings/addresses');
                  }}
                  style={{
                    backgroundColor: '#00C4CC',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '1rem'
                  }}
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
                  style={{
                    backgroundColor: '#00C4CC',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '1rem'
                  }}
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
                  style={{
                    backgroundColor: '#00C4CC',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '1rem'
                  }}
                >
                  View Profile
                </button>
              )}
            </div>
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              {selectedNotif.isUnread && !selectedNotif.isSystem ? (
                <button
                  onClick={() => handleMarkAsRead(selectedNotif.id)}
                  style={{
                    backgroundColor: '#00C4CC',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Mark as Read
                </button>
              ) : !selectedNotif.isSystem ? (
                <button
                  onClick={() => handleMarkAsUnread(selectedNotif.id)}
                  style={{
                    backgroundColor: '#f0f0f0',
                    color: '#333',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Mark as Unread
                </button>
              ) : null}
              <button
                onClick={closeModal}
                style={{
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
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