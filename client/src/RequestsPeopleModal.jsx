import React, { useState, useEffect } from 'react';
import ChatDrawer from './ChatDrawer.jsx';

const RequestsPeopleModal = ({ club, isOpen, onClose, isManager, user, API, onConversationUpdate }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState({ pending: [], accepted: [], declined: [] });
  const [members, setMembers] = useState([]);
  const [inviteUsername, setInviteUsername] = useState('');
  const [autoApprove, setAutoApprove] = useState(club?.auto_approve_join || false);
  const [loading, setLoading] = useState(false);
  
  // Chat-related state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState(null);

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

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isManager) {
        fetchRequests();
        fetchMembers();
      } else {
        // For non-managers, only fetch members using the people endpoint
        fetchPeople();
      }
    }
  }, [isOpen, isManager, club?.id]);

  // Update auto-approve state when club data changes
  useEffect(() => {
    setAutoApprove(club?.auto_approve_join || false);
  }, [club?.auto_approve_join]);

  const fetchRequests = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API}/clubs/${club.id}/requests`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API}/clubs/${club.id}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchPeople = async () => {
    try {
      const response = await makeAuthenticatedRequest(`${API}/clubs/${club.id}/people`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data); // Use the same members state
      }
    } catch (error) {
      console.error('Error fetching people:', error);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${API}/clubs/${club.id}/requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        fetchRequests();
        fetchMembers();
      }
    } catch (error) {
      console.error('Error handling request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationAction = async (inviteId, action) => {
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${API}/me/invitations/${inviteId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        // Refresh data after action
        fetchUserInvitations();
        if (action === 'accept') {
          // Optionally reload the page or notify parent component
          window.location.reload();
        }
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${action} invitation`);
      }
    } catch (error) {
      console.error('Error handling invitation:', error);
      alert(`Failed to ${action} invitation`);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteUsername.trim()) return;
    
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${API}/clubs/${club.id}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ username: inviteUsername })
      });
      
      if (response.ok) {
        setInviteUsername('');
        // Optionally refresh data or show success message
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoApprove = async () => {
    const newValue = !autoApprove;
    setLoading(true);
    try {
      const response = await makeAuthenticatedRequest(`${API}/clubs/${club.id}/auto-approve`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: newValue })
      });
      
      if (response.ok) {
        setAutoApprove(newValue);
      }
    } catch (error) {
      console.error('Error toggling auto-approve:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle opening chat with a member
  const handleMessageUser = (member) => {
    // Normalize the member data structure since different endpoints return different formats
    // /clubs/:clubId/members returns: {user_id, username, role}
    // /clubs/:clubId/people returns: {id, name, role}
    const normalizedUser = {
      id: member.id || member.user_id,
      name: member.name || member.username,
      role: member.role
    };
    
    setChatUser(normalizedUser);
    setChatOpen(true);
  };

  // Handle closing chat
  const handleCloseChat = () => {
    setChatOpen(false);
    setChatUser(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">
            {isManager ? 'Club Management' : 'Club Members'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {isManager ? (
          // Manager View - full management interface
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Tabs for mobile, side-by-side for desktop */}
            <div className="lg:hidden">
              <div className="flex border-b">
                <button
                  className={`flex-1 py-2 px-4 ${activeTab === 'requests' ? 'border-b-2 border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setActiveTab('requests')}
                >
                  Requests
                </button>
                <button
                  className={`flex-1 py-2 px-4 ${activeTab === 'people' ? 'border-b-2 border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setActiveTab('people')}
                >
                  People
                </button>
              </div>
            </div>

            {/* Requests Panel */}
            <div className={`flex-1 p-4 ${activeTab === 'requests' ? 'block' : 'hidden'} lg:block lg:border-r`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Join Requests</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={toggleAutoApprove}
                    disabled={loading}
                  />
                  <span className="text-sm">Auto-approve</span>
                </label>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Pending Requests */}
                {requests.pending.length > 0 && (
                  <div>
                    <h4 className="font-medium text-orange-600 mb-2">Pending ({requests.pending.length})</h4>
                    {requests.pending.map(request => (
                      <div key={request.id} className="bg-orange-50 p-3 rounded border">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{request.username}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="space-x-2">
                            <button
                              onClick={() => handleRequestAction(request.id, 'accept')}
                              disabled={loading}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRequestAction(request.id, 'decline')}
                              disabled={loading}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Accepted Requests */}
                {requests.accepted.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">Accepted ({requests.accepted.length})</h4>
                    {requests.accepted.map(request => (
                      <div key={request.id} className="bg-green-50 p-3 rounded border">
                        <div className="font-medium">{request.username}</div>
                        <div className="text-sm text-gray-600">
                          Accepted on {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Declined Requests */}
                {requests.declined.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Declined ({requests.declined.length})</h4>
                    {requests.declined.map(request => (
                      <div key={request.id} className="bg-red-50 p-3 rounded border">
                        <div className="font-medium">{request.username}</div>
                        <div className="text-sm text-gray-600">
                          Declined on {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {requests.pending.length === 0 && requests.accepted.length === 0 && requests.declined.length === 0 && (
                  <div className="text-gray-500 text-center py-8">No join requests</div>
                )}
              </div>
            </div>

            {/* People Panel */}
            <div className={`flex-1 p-4 ${activeTab === 'people' ? 'block' : 'hidden'} lg:block`}>
              <h3 className="text-lg font-semibold mb-4">Club Members</h3>

              {/* Invite form */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <h4 className="font-medium mb-2">Invite User</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="Username"
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <button
                    onClick={sendInvitation}
                    disabled={loading || !inviteUsername.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Invite
                  </button>
                </div>
              </div>

              {/* Members list */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {members.map(member => (
                  <div key={member.user_id} className="bg-gray-50 p-3 rounded border">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{member.username}</div>
                        <div className="text-sm text-gray-600">
                          {member.role}
                        </div>
                      </div>
                      {/* Message button - don't show for current user */}
                      {member.user_id !== user?.id && (
                        <button
                          onClick={() => handleMessageUser(member)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                        >
                          Message
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="text-gray-500 text-center py-8">No members found</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Regular User View - Club Members Only
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Club Members</h3>
            <div className="space-y-2">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{member.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      member.role === 'manager' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                  {/* Message button - don't show for current user */}
                  {member.id !== user?.id && (
                    <button
                      onClick={() => handleMessageUser(member)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Message
                    </button>
                  )}
                </div>
              ))}
              {members.length === 0 && (
                <div className="text-gray-500 text-center py-4">No members found</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Chat Drawer */}
      {chatOpen && (
        <ChatDrawer
          isOpen={chatOpen}
          onClose={handleCloseChat}
          currentUser={user}
          otherUser={chatUser}
          clubId={club?.id}
          API={API}
          onConversationUpdate={onConversationUpdate}
          onUnreadCountChange={onConversationUpdate} // Use same callback for now
        />
      )}
    </div>
  );
};

export default RequestsPeopleModal;