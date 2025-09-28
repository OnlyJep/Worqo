import React, { useState, useEffect } from 'react';
import Headerz from "./Headerz";
import Footer from '../FooterContent/footer';

const Notif = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // Track active tab: 'all' or 'unread'

  // Simulated current user ID (e.g., Jeff Ogabang, id: 1)
  const currentUserId = 1;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/users');
        const data = await response.json();
        const users = data.users;

        // Find the current user
        const currentUser = users.find(user => user.id === currentUserId);

        if (currentUser) {
          // Create a personalized welcome notification for the current user
          setNotifications([{
            id: currentUser.id,
            user: `${currentUser.first_name} ${currentUser.last_name || ''} ${currentUser.suffix_name || ''}`.trim(),
            action: "Welcome to Worqo Job Portal!",
            platform: "Worqo Job Portal",
            time: "Just now",
            profile_img: currentUser.profile_img,
            isUnread: true,
            message: `Hi ${currentUser.first_name}, welcome to Worqo Job Portal! Start exploring job opportunities or manage your profile to get started.`
          }]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const unreadCount = notifications.filter(notif => notif.isUnread).length;

  const handleMarkAsRead = (notifId) => {
    setNotifications(notifications.map(notif =>
      notif.id === notifId ? { ...notif, isUnread: false } : notif
    ));
    setIsModalOpen(false);
  };

  const handleMarkAsUnread = (notifId) => {
    setNotifications(notifications.map(notif =>
      notif.id === notifId ? { ...notif, isUnread: true } : notif
    ));
    setIsModalOpen(false);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, isUnread: false })));
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

  const displayedNotifications = activeTab === 'unread'
    ? notifications.filter(notif => notif.isUnread)
    : notifications;

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
            
            {displayedNotifications.length > 0 ? (
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
                  />
                  <img 
                    src={notif.profile_img ? `http://127.0.0.1:8000/storage/${notif.profile_img}` : '/default-profile.png'} 
                    alt={notif.user} 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      marginRight: '1rem' 
                    }} 
                  />
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openModal(notif)}>
                    <p style={{ margin: '0', fontWeight: notif.isUnread ? 'bold' : 'normal' }}>
                      {notif.user} {notif.action}
                    </p>
                    <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '0.9rem' }}>
                      {notif.time}
                    </p>
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
                  src={selectedNotif.profile_img ? `http://127.0.0.1:8000/storage/${selectedNotif.profile_img}` : '/default-profile.png'} 
                  alt={selectedNotif.user} 
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '50%', 
                    marginRight: '1rem' 
                  }} 
                />
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{selectedNotif.user}</p>
                  <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '0.9rem' }}>
                    {selectedNotif.time}
                  </p>
                </div>
              </div>
              <p style={{ margin: '1rem 0' }}>{selectedNotif.message}</p>
            </div>
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              {selectedNotif.isUnread ? (
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
              ) : (
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
              )}
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