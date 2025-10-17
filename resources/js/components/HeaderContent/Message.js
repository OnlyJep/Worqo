import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Headerz from './Headerz';
import './../../../sass/components/Message.scss';

const Message = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [otherUserInfo, setOtherUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

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

  const handleSendMessage = async () => {
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
        recipient_id: recipientId,
        content,
        sender_id: userId
      };
      
      const config = token ? { 
        headers: { 
          'Authorization': `Bearer ${token}`,
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
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Function to format user name
  const formatUserName = (userInfo) => {
    if (!userInfo) return 'Unknown User';
    return userInfo.name || 'Unknown User';
  };

  // Function to render user collar
  const renderUserCollar = (collar) => {
    if (!collar) return null;
    
    return (
      <div className="user-collar">
        <h4>Collar</h4>
        <div className="collar-info">
          {collar.image && (
            <img 
              src={`http://127.0.0.1:8000/storage/${collar.image}`} 
              alt={collar.name} 
              className="collar-image"
              onError={(e) => { e.target.src = '/images/defpfp.svg'; }}
            />
          )}
          <span className="collar-name">{collar.name}</span>
        </div>
      </div>
    );
  };

  // Function to render user rank
  const renderUserRank = (rank) => {
    if (!rank) return null;
    
    return (
      <div className="user-rank">
        <h4>Rank</h4>
        <div className="rank-info">
          {rank.image && (
            <img 
              src={`http://127.0.0.1:8000/storage/${rank.image}`} 
              alt={rank.name} 
              className="rank-image"
              onError={(e) => { e.target.src = '/images/defpfp.svg'; }}
            />
          )}
          <span className="rank-name">{rank.name}</span>
        </div>
      </div>
    );
  };

  // Function to handle View Profile button click
  const handleViewProfile = (userId) => {
    // Navigate to the user's profile page
    window.location.href = `/profile/${userId}`;
  };

  if (loading) {
    return (
      <div className="message-container">
        <Headerz />
        <div className="message-content">
          <div className="loading-container">
            <p>Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message-container">
      <Headerz />
      
      <div className="message-content">
        {/* Conversation Sidebar */}
        <div className="conversation-sidebar">
          <div className="sidebar-header">
            <h3>Messages</h3>
            <span className="conversation-count">{conversations.length}</span>
          </div>
          
          <div className="conversation-list">
            {conversations.map((conversation) => (
              <div
                key={conversation.user_id}
                className={`conversation-item ${selectedConversation?.user_id === conversation.user_id ? 'active' : ''}`}
                onClick={() => handleConversationSelect(conversation)}
              >
                <div className="conversation-avatar">
                  <div className="avatar-placeholder">
                    {conversation.name?.charAt(0) || 'U'}
                  </div>
                </div>
                
                <div className="conversation-details">
                  <div className="conversation-header">
                    <span className="conversation-name">{conversation.name || 'Unknown User'}</span>
                    {conversation.last_message_at && (
                      <span className="conversation-time">
                        {new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="conversation-preview">
                    {conversation.last_message_at ? 
                      'Last message: ' + new Date(conversation.last_message_at).toLocaleDateString() : 
                      'No messages yet'}
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
                <span className="online-status">Online</span>
              </div>
              
              {/* User Profile Info */}
              {otherUserInfo && (
                <div className="user-profile-info">
                  <div className="user-profile-header">
                    <img 
                      src={otherUserInfo.profile_img 
                        ? `http://127.0.0.1:8000/storage/${otherUserInfo.profile_img}` 
                        : '/images/defpfp.svg'
                      } 
                      alt={formatUserName(otherUserInfo)} 
                      className="user-profile-img"
                      onError={(e) => { e.target.src = '/images/defpfp.svg'; }}
                    />
                    <div className="user-profile-details">
                      <h3 className="user-name">{formatUserName(otherUserInfo)}</h3>
                      {otherUserInfo.worker && otherUserInfo.worker.verified && (
                        <span className="verified-badge">Verified</span>
                      )}
                      <div className="user-status">
                        <span className={`status-indicator ${otherUserInfo.is_online ? 'online' : 'offline'}`}></span>
                        <span className="status-text">
                          {otherUserInfo.last_active_text || (otherUserInfo.is_online ? 'Online' : 'Offline')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="user-contact-info">
                    {otherUserInfo.contact_number && (
                      <div className="contact-number">
                        <span className="contact-label">Contact:</span>
                        <span className="contact-value">{otherUserInfo.contact_number}</span>
                      </div>
                    )}
                  </div>
                  
                  {otherUserInfo.worker && (
                    <div className="user-worker-details">
                      {otherUserInfo.worker.collar && renderUserCollar(otherUserInfo.worker.collar)}
                      {otherUserInfo.worker.rank && renderUserRank(otherUserInfo.worker.rank)}
                    </div>
                  )}
                  
                  <div className="profile-actions">
                    <button 
                      className="view-profile-btn"
                      onClick={() => handleViewProfile(otherUserInfo.id)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              )}
              
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
              <div className="chat-input">
                <input 
                  type="text" 
                  placeholder="Type your message..." 
                  className="message-input"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button 
                  className="send-button" 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  Send
                </button>
              </div>
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

export default Message;