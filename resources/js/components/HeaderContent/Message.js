import React, { useState } from 'react';
import Headerz from './Headerz';
import './../../../sass/components/Message.scss';

const Message = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversations] = useState([
    { id: 1, name: 'John Doe', lastMessage: 'Hey, how are you?', time: '2:30 PM', unread: true },
    { id: 2, name: 'Jane Smith', lastMessage: 'The project is ready', time: '1:45 PM', unread: false },
    { id: 3, name: 'Mike Johnson', lastMessage: 'Can we meet tomorrow?', time: '12:20 PM', unread: true },
    { id: 4, name: 'Sarah Wilson', lastMessage: 'Thanks for your help!', time: '11:15 AM', unread: false },
    { id: 5, name: 'David Brown', lastMessage: 'I sent you the files', time: '10:30 AM', unread: false },
  ]);
  
  // Store messages for each conversation
  const [messages, setMessages] = useState({
    1: [
      { id: 1, text: 'Hey, how are you?', sender: 'John Doe', time: '2:30 PM', isOwn: false },
    ],
    2: [
      { id: 1, text: 'The project is ready', sender: 'Jane Smith', time: '1:45 PM', isOwn: false },
    ],
    3: [
      { id: 1, text: 'Can we meet tomorrow?', sender: 'Mike Johnson', time: '12:20 PM', isOwn: false },
    ],
    4: [
      { id: 1, text: 'Thanks for your help!', sender: 'Sarah Wilson', time: '11:15 AM', isOwn: false },
    ],
    5: [
      { id: 1, text: 'I sent you the files', sender: 'David Brown', time: '10:30 AM', isOwn: false },
    ],
  });

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      const newMessage = {
        id: Date.now(),
        text: messageInput.trim(),
        sender: 'You',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      };

      // Add message to the conversation
      setMessages(prevMessages => ({
        ...prevMessages,
        [selectedConversation.id]: [
          ...(prevMessages[selectedConversation.id] || []),
          newMessage
        ]
      }));

      // Update the conversation's last message in the sidebar
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: messageInput.trim(), time: newMessage.time }
            : conv
        )
      );

      // Clear the input
      setMessageInput('');
      
      console.log('Message sent:', newMessage);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
                key={conversation.id}
                className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''} ${conversation.unread ? 'unread' : ''}`}
                onClick={() => handleConversationSelect(conversation)}
              >
                <div className="conversation-avatar">
                  <div className="avatar-placeholder">
                    {conversation.name.charAt(0)}
                  </div>
                  {conversation.unread && <div className="unread-indicator"></div>}
                </div>
                
                <div className="conversation-details">
                  <div className="conversation-header">
                    <span className="conversation-name">{conversation.name}</span>
                    <span className="conversation-time">{conversation.time}</span>
                  </div>
                  <div className="conversation-preview">
                    {conversation.lastMessage}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedConversation ? (
            <div className="chat-content">
              <div className="chat-header">
                <h3>{selectedConversation.name}</h3>
                <span className="online-status">Online</span>
              </div>
                             <div className="chat-messages">
                 {messages[selectedConversation.id] && messages[selectedConversation.id].length > 0 ? (
                   <div className="messages-list">
                     {messages[selectedConversation.id].map((message) => (
                       <div
                         key={message.id}
                         className={`message-item ${message.isOwn ? 'own-message' : 'other-message'}`}
                       >
                         <div className="message-content">
                           <div className="message-text">{message.text}</div>
                           <div className="message-time">{message.time}</div>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="message-placeholder">
                     <p>Start your conversation with {selectedConversation.name}</p>
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
