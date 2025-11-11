import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Headerz from './Headerz';
import { HiOutlineDotsVertical } from "react-icons/hi";
import { MdOutlineKeyboardVoice } from "react-icons/md";
import { GoPlus } from "react-icons/go";
import { IoMdSend } from "react-icons/io";
import { IoArrowBack } from "react-icons/io5";
import './../../../sass/components/MessageWorker.scss';
import { getProfileImageUrl } from '../../utils/profileImageUtils';
import Loader from '../LoaderContent/loader';

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [otherUserInfo, setOtherUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const chatMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);

  // Get user role from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const roleId = stored?.role_id || stored?.user?.role_id;
    if (roleId) {
      setUserRole(roleId === 1 ? 'worker' : 'employer');
    }
  }, []);

  useEffect(() => {
    fetchConversations(true);
    fetchActiveUsers();
  }, []);

  // Periodically refresh selected conversation's profile status (online/last active)
  useEffect(() => {
    if (!selectedConversation) return;

    const token = localStorage.getItem('auth_token');
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = stored?.id || stored?.user?.id;

    const refresh = async () => {
      try {
        const config = token ? { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userId
          } 
        } : {};
        const res = await axios.get(`/api/messages/thread/${selectedConversation.user_id}`, {
          ...config,
          params: { user_id: userId }
        });
        if (res.data?.other_user_info) {
          setOtherUserInfo(res.data.other_user_info);
        }
      } catch (e) {
        // ignore
      }
    };

    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Close chat menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setShowChatMenu(false);
      }
    };

    if (showChatMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatMenu]);

  const fetchConversations = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem('auth_token');
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = stored?.id || stored?.user?.id;
      
      if (!userId) {
        console.error('User ID not found');
        if (showLoading) setLoading(false);
        return;
      }
      
      const config = token ? { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId
        } 
      } : {};
      
      // Check if there's a target user ID in localStorage (set when navigating from booking)
      const targetUserId = localStorage.getItem('message_target_user_id');
      
      const response = await axios.get(`/api/messages/conversations`, {
        ...config,
        params: { user_id: userId }
      });
      
      if (response.data.success) {
        const fetchedConversations = response.data.conversations || [];
        setConversations(fetchedConversations);
        
        // If there's a target user ID, try to find or create a conversation with them
        if (targetUserId) {
          const existingConversation = fetchedConversations.find(conv => conv.user_id == targetUserId);
          if (existingConversation) {
            // Select existing conversation
            handleConversationSelect(existingConversation);
          } else {
            // No existing conversation, fetch user info directly to show their profile
            try {
              const threadResponse = await axios.get(`/api/messages/thread/${targetUserId}`, {
                ...config,
                params: { user_id: userId }
              });
              
              if (threadResponse.data.success) {
                // Create a temporary conversation object
                const tempConversation = {
                  user_id: parseInt(targetUserId),
                  name: threadResponse.data.other_user_info?.name || 'Unknown User',
                  profile_img: threadResponse.data.other_user_info?.profile_img || null,
                  last_message_at: null,
                  detailed_info: threadResponse.data.other_user_info,
                  unread_count: 0,
                  last_message: null
                };
                
                // Set messages (empty array if no messages yet)
                setMessages(prev => ({ ...prev, [targetUserId]: threadResponse.data.messages || [] }));
                
                // Set other user info
                if (threadResponse.data.other_user_info) {
                  setOtherUserInfo(threadResponse.data.other_user_info);
                }
                
                // Set selected conversation
                setSelectedConversation(tempConversation);
              }
            } catch (error) {
              console.error('Error fetching user info:', error.response?.data || error.message);
            }
          }
          // Remove the target user ID from localStorage so it doesn't persist
          localStorage.removeItem('message_target_user_id');
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error.response?.data || error.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = stored?.id || stored?.user?.id;
      
      if (!userId) {
        console.error('User ID not found');
        return;
      }
      
      const config = token ? { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId
        } 
      } : {};
      
      // Fetch all users with profiles
      const response = await axios.get(`/api/bookings/users-with-profiles`, config);
      
      console.log('Active users response:', response.data);
      
      if (response.data && response.data.users) {
        setActiveUsers(response.data.users);
        console.log('Set active users count:', response.data.users.length);
      }
    } catch (error) {
      console.error('Error fetching active users:', error.response?.data || error.message);
    }
  };

  const filteredActiveUsers = activeUsers.filter((user) => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = stored?.id || stored?.user?.id;
    
    // Exclude current user from the list
    if (user.user_id == currentUserId) {
      return false;
    }
    
    // Filter based on user role: workers see employers, employers see workers
    if (userRole === 'worker') {
      // Workers see employers (role_id === 2)
      if (user.role_id !== 2) {
        return false;
      }
    } else if (userRole === 'employer') {
      // Employers see workers (role_id === 1)
      if (user.role_id !== 1) {
        return false;
      }
    }
    
    // Filter by search query
    if (!searchQuery.trim()) return true;
    const name = (user.full_name || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const handleConversationSelect = async (conversation) => {
    setSelectedConversation(conversation);
    const token = localStorage.getItem('auth_token');
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = stored?.id || stored?.user?.id;
    
    if (!userId) {
      console.error('User ID not found');
      return;
    }
    
    try {
      const config = token ? { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId
        } 
      } : {};
      
      const response = await axios.get(`/api/messages/thread/${conversation.user_id}`, {
        ...config,
        params: { user_id: userId }
      });
      
      if (response.data.success) {
        setMessages(prev => ({ ...prev, [conversation.user_id]: response.data.messages || [] }));
        
        // Set other user info if available
        if (response.data.other_user_info) {
          setOtherUserInfo(response.data.other_user_info);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error.response?.data || error.message);
    }
  };

  const handleBackToSidebar = () => {
    setShowSidebar(true);
    setSelectedConversation(null);
    setOtherUserInfo(null);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const content = messageInput.trim();
    if (!content) return;
    
    const token = localStorage.getItem('auth_token');
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = stored?.id || stored?.user?.id;
    
    if (!userId) {
      console.error('User ID not found');
      return;
    }
    
    try {
      // Determine recipient ID
      let recipientId;
      if (selectedConversation) {
        recipientId = selectedConversation.user_id;
      } else {
        // Check if there's a target user ID from localStorage
        recipientId = localStorage.getItem('message_target_user_id');
        if (!recipientId) {
          console.error('No recipient specified');
          return;
        }
      }
      
      const payload = {
        recipient_id: parseInt(recipientId),
        content
      };
      
      console.log('Sending message payload:', payload);
      console.log('Recipient ID type:', typeof parseInt(recipientId), 'Value:', parseInt(recipientId));
      console.log('Sender ID from localStorage:', userId);
      
      const config = token ? { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-User-Id': userId,
          'Content-Type': 'application/json'
        } 
      } : {};
      
      const response = await axios.post(`/api/messages/send`, payload, config);
      
      if (response.data.success) {
        const newMsg = response.data.message;
        
        // Update messages state
        setMessages(prev => ({
          ...prev,
          [recipientId]: [ ...(prev[recipientId] || []), newMsg ]
        }));
        
        setMessageInput('');
        
        // Trigger message update event for header badge
        window.dispatchEvent(new Event('messageUpdated'));
        
        // If this is a new conversation (no selectedConversation), update conversations list
        if (!selectedConversation) {
          // Fetch updated conversations
          await fetchConversations();
          
          // Find and select the new conversation
          const updatedConversations = conversations || [];
          const newConversation = updatedConversations.find(conv => conv.user_id == recipientId);
          if (newConversation) {
            setSelectedConversation(newConversation);
            
            // Get detailed user info for the new conversation
            const userResponse = await axios.get(`/api/messages/thread/${recipientId}`, {
              ...config,
              params: { user_id: userId }
            });
            
            if (userResponse.data.success && userResponse.data.other_user_info) {
              setOtherUserInfo(userResponse.data.other_user_info);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Handle file attachment
      console.log('Files selected:', files);
      // You can add file handling logic here
    }
  };

  const handleVoiceClick = () => {
    console.log('Voice recording clicked');
    // You can add voice recording logic here
  };

  // Function to format user name
  const formatUserName = (userInfo) => {
    if (!userInfo) return 'Unknown User';
    return userInfo.name || 'Unknown User';
  };

  // Function to handle View Profile button click
  const handleViewProfile = (userId) => {
    // Navigate to the user's profile page
    window.location.href = `/profile/${userId}`;
  };

  if (loading) {
    return (
      <div className="message-worker-container">
        <Headerz />
        <div className="message-worker-content">
          <div className="loading-container">
            <Loader />
            <p style={{ marginTop: '20px', fontSize: '16px', color: '#666' }}>Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message-worker-container">
      <Headerz />
      
      <div className="message-worker-content">
        {/* Conversation Sidebar */}
        <div className={`conversation-sidebar ${!showSidebar ? 'sidebar-hidden' : ''}`}>
          <div className="sidebar-header">
            <h3>Messages</h3>
            <span className="conversation-count">{conversations.length}</span>
          </div>

          {/* Search Bar */}
          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <span className="search-icon"></span>
              <input
                type="text"
                placeholder={userRole === 'worker' ? 'Search Employers' : 'Search Workers'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="conversation-list">
            {/* Render existing conversations first */}
            {conversations.map((conv) => (
              <div
                key={conv.user_id}
                className={`conversation-item ${conv.unread_count > 0 ? 'unread' : ''} ${selectedConversation?.user_id === conv.user_id ? 'active' : ''}`}
                onClick={() => handleConversationSelect(conv)}
              >
                <div className="conversation-avatar">
                  {conv?.detailed_info?.profile_img || conv?.profile_img ? (
                    <img 
                      src={getProfileImageUrl(conv?.detailed_info?.profile_img || conv?.profile_img, 'images/defpfp.svg')} 
                      alt={conv.name || 'User'} 
                      className="avatar-image"
                      onError={(e) => {
                        e.currentTarget.src = `${window.location.origin}/images/defpfp.svg`;
                      }}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {conv.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  {conv.unread_count > 0 && (
                    <span className="unread-indicator">{conv.unread_count}</span>
                  )}
                </div>
                
                <div className="conversation-details">
                  <div className="conversation-header">
                    <span className="conversation-name" style={{display:'inline-flex',alignItems:'center',gap:6}}>
                      <span>{conv.name || 'Unknown User'}</span>
                      {conv?.detailed_info?.worker?.collar?.image && (
                        <img 
                          src={`${window.location.origin}/storage/${conv.detailed_info.worker.collar.image}`} 
                          alt="collar" 
                          style={{width:16,height:16,borderRadius:3}}
                          onError={(e)=>{e.currentTarget.style.display='none';}}
                        />
                      )}
                      {(conv?.detailed_info?.worker?.verified === true || conv?.detailed_info?.worker?.verified === 1) && (
                        <img 
                          src={`${window.location.origin}/images/verified.png`} 
                          alt="verified" 
                          style={{width:14,height:14}}
                          onError={(e)=>{e.currentTarget.style.display='none';}}
                        />
                      )}
                    </span>
                    <span className="conversation-time">
                      {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="worker-conversation-preview">
                    {conv.last_message && (() => {
                      const stored = JSON.parse(localStorage.getItem('user') || '{}');
                      const currentUserId = stored?.id || stored?.user?.id;
                      const isSentByMe = conv.last_message.sender_id == currentUserId;
                      const maxLength = 50;
                      const preview = conv.last_message.content.length > maxLength 
                        ? conv.last_message.content.substring(0, maxLength) + '...' 
                        : conv.last_message.content;
                      // Show "You: " if sent by current user, otherwise show sender's name
                      if (isSentByMe) {
                        return `You: ${preview}`;
                      } else {
                        // Show full name for employers, first name for workers
                        const senderName = conv.name || (userRole === 'worker' ? 'Employer' : 'Worker');
                        if (userRole === 'worker') {
                          // Workers see first name only
                          const firstName = senderName.split(' ')[0];
                          return `${firstName}: ${preview}`;
                        } else {
                          // Employers see full name
                          return `${senderName}: ${preview}`;
                        }
                      }
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`chat-area ${!showSidebar ? 'chat-area-full' : ''}`}>
          {selectedConversation || localStorage.getItem('message_target_user_id') ? (
            <div className="chat-content">
              <div className="chat-header">
                <div className="chat-header-left">
                  {!showSidebar && (
                    <button 
                      className="back-button" 
                      onClick={handleBackToSidebar}
                      aria-label="Back to conversations"
                    >
                      <IoArrowBack />
                    </button>
                  )}
                  <h3>
                    {selectedConversation ? (
                      <span style={{display:'inline-flex',alignItems:'center',gap:8}}>
                        <span>{selectedConversation.name}</span>
                        {otherUserInfo?.worker?.collar?.image && (
                          <img 
                            src={`${window.location.origin}/storage/${otherUserInfo.worker.collar.image}`} 
                            alt="collar" 
                            style={{width:20,height:20,borderRadius:4}}
                            onError={(e)=>{e.currentTarget.style.display='none';}}
                          />
                        )}
                        {(otherUserInfo?.worker?.verified === true || otherUserInfo?.worker?.verified === 1) && (
                          <img 
                            src={`${window.location.origin}/images/verified.png`} 
                            alt="verified" 
                            style={{width:18,height:18}}
                            onError={(e)=>{e.currentTarget.style.display='none';}}
                          />
                        )}
                      </span>
                    ) : 'New Conversation'}
                  </h3>
                </div>
                <div className="chat-header-actions">
                  <span className={`online-status ${otherUserInfo?.is_online ? 'online' : 'offline'}`}>
                    {otherUserInfo?.is_online ? 'Online' : (otherUserInfo?.last_active_text || 'Offline')}
                  </span>
                  <div className="chat-menu-wrapper" ref={chatMenuRef}>
                    <HiOutlineDotsVertical 
                      className="chat-menu-icon" 
                      onClick={() => setShowChatMenu(!showChatMenu)}
                    />
                    {showChatMenu && (
                      <div className="chat-menu-dropdown">
                        {otherUserInfo && (
                          <div 
                            className="chat-menu-item"
                            onClick={() => {
                              handleViewProfile(otherUserInfo.id);
                              setShowChatMenu(false);
                            }}
                          >
                            View Profile
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="chat-messages">
                {selectedConversation && messages[selectedConversation.user_id] && messages[selectedConversation.user_id].length > 0 ? (
                  <div className="messages-list">
                    {messages[selectedConversation.user_id].map((message) => (
                      <div
                        key={message.id}
                        className={`message-item ${message.sender_id === (JSON.parse(localStorage.getItem('user') || '{}')?.id || JSON.parse(localStorage.getItem('user') || '{}')?.user?.id) ? 'own-message' : 'other-message'}`}
                      >
                        <div className="message-content">
                          <div className="message-text">{message.content}</div>
                          <div className="message-time">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="message-placeholder">
                    <p>Start your conversation</p>
                  </div>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="chat-input">
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                <button type="button" className="icon-btn attach-btn" onClick={handleAttachClick}>
                  <GoPlus />
                </button>
                <div className="input-wrapper">
                  <input 
                    ref={messageInputRef}
                    type="text" 
                    placeholder="Write your message here..." 
                    className="message-input"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button type="button" className="icon-btn voice-btn" onClick={handleVoiceClick}>
                    <MdOutlineKeyboardVoice />
                  </button>
                </div>
                <button type="submit" className="send-button" disabled={!messageInput.trim()}>
                  <IoMdSend />
                </button>
              </form>
            </div>
          ) : (
            <div className="no-conversation-selected">
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

