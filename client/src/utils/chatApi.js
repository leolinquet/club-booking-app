// Chat API Helper Functions

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

/**
 * Get or create a conversation between current user and another user in a club
 * @param {string} API - API base URL
 * @param {number} clubId - Club ID
 * @param {number} otherUserId - Other user's ID
 * @returns {Promise<{conversation: Object, messages: Array}>}
 */
export const getOrCreateConversation = async (API, clubId, otherUserId) => {
  const response = await makeAuthenticatedRequest(`${API}/api/chat/conversations/get-or-create`, {
    method: 'POST',
    body: JSON.stringify({
      club_id: clubId,
      other_user_id: otherUserId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get or create conversation');
  }

  return response.json();
};

/**
 * Load messages for a conversation
 * @param {string} API - API base URL
 * @param {number} conversationId - Conversation ID
 * @param {number} page - Page number (optional, default 1)
 * @param {number} limit - Messages per page (optional, default 100)
 * @returns {Promise<{messages: Array, pagination: Object}>}
 */
export const loadMessages = async (API, conversationId, page = 1, limit = 100) => {
  const url = new URL(`${API}/api/chat/conversations/${conversationId}/messages`);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('limit', limit.toString());

  const response = await makeAuthenticatedRequest(url.toString());

  if (!response.ok) {
    throw new Error('Failed to load messages');
  }

  return response.json();
};

/**
 * Send a new message
 * @param {string} API - API base URL
 * @param {number} conversationId - Conversation ID
 * @param {string} body - Message content
 * @returns {Promise<Object>} - The sent message
 */
export const sendMessage = async (API, conversationId, body) => {
  const response = await makeAuthenticatedRequest(`${API}/api/chat/messages`, {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: conversationId,
      body: body.trim()
    })
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
};

/**
 * Poll for new messages in a conversation
 * @param {string} API - API base URL
 * @param {number} conversationId - Conversation ID
 * @param {Function} onNewMessages - Callback for when new messages are received
 * @param {number} interval - Polling interval in milliseconds (default 3000)
 * @returns {Function} - Cleanup function to stop polling
 */
export const startMessagePolling = (API, conversationId, onNewMessages, interval = 3000) => {
  let lastMessageCount = 0;
  
  const poll = async () => {
    try {
      const data = await loadMessages(API, conversationId);
      if (data.messages.length > lastMessageCount) {
        lastMessageCount = data.messages.length;
        onNewMessages(data.messages);
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  };

  const intervalId = setInterval(poll, interval);

  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Format message timestamp for display
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} - Formatted time string
 */
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  
  return date.toLocaleDateString();
};

/**
 * Get user initials for avatar display
 * @param {string} name - User's display name
 * @returns {string} - User initials (max 2 characters)
 */
export const getUserInitials = (name) => {
  if (!name) return '?';
  
  const names = name.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};