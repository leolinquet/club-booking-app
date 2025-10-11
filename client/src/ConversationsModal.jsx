import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import ChatDrawer from './ChatDrawer.jsx';

const ConversationsModal = forwardRef(({ isOpen, onClose, user, API }, ref) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

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

  // Load user's conversations
  const loadConversations = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${API}/api/chat/conversations`);
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else {
        console.error('Failed to load conversations');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle opening a conversation
  const handleOpenConversation = (conversation) => {
    setSelectedConversation({
      conversation,
      otherUser: {
        id: conversation.other_user_id,
        name: conversation.other_user_name
      },
      clubId: conversation.club_id
    });
    setChatOpen(true);
  };

  // Handle closing chat
  const handleCloseChat = () => {
    setChatOpen(false);
    setSelectedConversation(null);
    // Reload conversations when chat closes to update latest message
    loadConversations();
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refreshConversations: loadConversations
  }));

  // Load conversations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, user?.id]);

  // Format timestamp for display
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  // Truncate message for preview
  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return 'No messages yet';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">💬 Your Conversations</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">💬</div>
                <p>No conversations yet</p>
                <p className="text-sm">Start chatting with club members!</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleOpenConversation(conversation)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {conversation.other_user_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      
                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.other_user_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500 flex-shrink-0">
                            {formatMessageTime(conversation.latest_message_time)}
                          </p>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-1">
                          in {conversation.club_name}
                        </p>
                        
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.latest_message_is_mine && 'You: '}
                          {truncateMessage(conversation.latest_message)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Drawer */}
      {chatOpen && selectedConversation && (
        <ChatDrawer
          isOpen={chatOpen}
          onClose={handleCloseChat}
          currentUser={user}
          otherUser={selectedConversation.otherUser}
          clubId={selectedConversation.clubId}
          API={API}
          onConversationUpdate={loadConversations}
        />
      )}
    </>
  );
});

export default ConversationsModal;