import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Headerz from './Headerz';
import { HiOutlineDotsVertical } from "react-icons/hi";
import { MdOutlineKeyboardVoice } from "react-icons/md";
import { GoPlus } from "react-icons/go";
import { IoMdSend } from "react-icons/io";
import './../../../sass/components/MessageWorker.scss';

const MessageWorker = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [otherUserInfo, setOtherUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const chatMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchActiveUsers();
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

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = stored?.id || stored?.user?.id;
      
      if (!userId) {
        console.error('User ID not found');
        setLoading(false);
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
      
      const response = await axios.get('http://127.0.0.1:8000/api/messages/conversations', {
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
          }
          // Remove the target user ID from localStorage so it doesn't persist
          localStorage.removeItem('message_target_user_id');
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error.response?.data || error.message);
    } finally {
      setLoading(false);
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
      const response = await axios.get('http://127.0.0.1:8000/api/bookings/users-with-profiles', config);
      
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
      
      const response = await axios.get(`http://127.0.0.1:8000/api/messages/thread/${conversation.user_id}`, {
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
      
      const response = await axios.post('http://127.0.0.1:8000/api/messages/send', payload, config);
      
      if (response.data.success) {
        const newMsg = response.data.message;
        
        // Update messages state
        setMessages(prev => ({
          ...prev,
          [recipientId]: [ ...(prev[recipientId] || []), newMsg ]
        }));
        
        setMessageInput('');
        
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
            const userResponse = await axios.get(`http://127.0.0.1:8000/api/messages/thread/${recipientId}`, {
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
            <p>Loading messages...</p>
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
        <div className="conversation-sidebar">
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
                placeholder="Search Contacts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="conversation-list">
            {filteredActiveUsers.map((user) => (
              <div
                key={user.user_id}
                className={`conversation-item ${selectedConversation?.user_id === user.user_id ? 'active' : ''}`}
                onClick={() => {
                  // Find or create conversation for this user
                  const existingConv = conversations.find(c => c.user_id == user.user_id);
                  if (existingConv) {
                    handleConversationSelect(existingConv);
                  } else {
                    // Create a temporary conversation object
                    const tempConv = {
                      user_id: user.user_id,
                      name: user.full_name
                    };
                    setSelectedConversation(tempConv);
                    // Store target user ID for sending first message
                    localStorage.setItem('message_target_user_id', String(user.user_id));
                  }
                }}
              >
                <div className="conversation-avatar">
                  <div className="avatar-placeholder">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                </div>
                
                <div className="conversation-details">
                  <div className="conversation-header">
                    <span className="conversation-name">{user.full_name || 'Unknown User'}</span>
                    <span className="conversation-time">11:24 AM</span>
                  </div>
                  <div className="conversation-preview">
                    How are you doing today?
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedConversation || localStorage.getItem('message_target_user_id') ? (
            <div className="chat-content">
              <div className="chat-header">
                <h3>
                  {selectedConversation ? selectedConversation.name : 'New Conversation'}
                </h3>
                <div className="chat-header-actions">
                  <span className="online-status">Online</span>
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

export default MessageWorker;

