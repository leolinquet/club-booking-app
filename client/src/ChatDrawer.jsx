import React, { useState, useEffect, useRef } from 'react';

const ChatDrawer = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  otherUser, 
  clubId,
  API,
  onConversationUpdate, // New prop for notifying parent of conversation changes
  onUnreadCountChange // New prop for refreshing unread counts
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Utility function for authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return fetch(url, {
      ...options,
      headers,
    });
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversation and initial messages
  const loadConversation = async () => {
    if (!otherUser || !clubId) return;
    
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${API}/api/chat/conversations/get-or-create`, {
        method: 'POST',
        body: JSON.stringify({
          club_id: clubId,
          other_user_id: otherUser.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setConversation(data.conversation);
        
        // Notify parent that conversation was created/loaded
        if (onConversationUpdate) {
          onConversationUpdate();
        }
      } else {
        console.error('Failed to load conversation');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for existing conversation
  const loadMessages = async (conversationId) => {
    if (!conversationId) return;
    
    try {
      const response = await makeAuthenticatedRequest(
        `${API}/api/chat/conversations/${conversationId}/messages`
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !conversation?.id) return;

    setSending(true);
    try {
      const response = await makeAuthenticatedRequest(`${API}/api/chat/messages`, {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: conversation.id,
          body: newMessage.trim()
        })
      });

      if (response.ok) {
        const message = await response.json();
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        
        // Notify parent that conversation was updated
        if (onConversationUpdate) {
          onConversationUpdate();
        }
        // Also refresh unread count since a new message was sent
        if (onUnreadCountChange) {
          onUnreadCountChange();
        }
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Polling for new messages
  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    pollingRef.current = setInterval(async () => {
      if (conversation?.id && isOpen) {
        try {
          const response = await makeAuthenticatedRequest(
            `${API}/api/chat/conversations/${conversation.id}/messages`
          );
          
          if (response.ok) {
            const data = await response.json();
            setMessages(prev => {
              // Only update if we have new messages
              if (data.messages.length > prev.length) {
                return data.messages;
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Error polling messages:', error);
        }
      }
    }, 3000); // Poll every 3 seconds
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Effects
  useEffect(() => {
    if (isOpen && otherUser && clubId) {
      loadConversation();
    }
  }, [isOpen, otherUser?.id, clubId]);

  useEffect(() => {
    if (isOpen && conversation?.id) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [isOpen, conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format message timestamp
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black bg-opacity-25 md:bg-transparent" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="w-full max-w-md bg-white shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
              {otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="font-semibold">{otherUser?.name || 'Unknown User'}</h3>
              <p className="text-blue-100 text-sm">Club Member</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet.</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === currentUser?.id;
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-800 border'
                  }`}>
                    <p className="text-sm">{message.body}</p>
                    <p className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t bg-white p-4">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending || !conversation?.id}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || !conversation?.id}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatDrawer;