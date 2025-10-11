// client/src/ClubGate.jsx
import React, { useState, useEffect } from 'react';

// Resolve a safe API base like App.jsx does so values like ":5051" become
// "http://localhost:5051" and protocol-relative or host-only strings are
// normalized. This prevents fetches to paths like ":5051/whatever" which
// the browser treats as a relative URL and leads to confusing errors.
const RAW_API = (typeof window !== 'undefined' && window.API_BASE) ? String(window.API_BASE) : (import.meta.env.VITE_API_BASE || '');
function normalizeApi(u) {
  if (!u) return 'http://localhost:5051';
  if (/^:\d+$/.test(u)) return 'http://localhost' + u; // ":5051" -> http://localhost:5051
  if (/^\/\//.test(u)) return (typeof window !== 'undefined' ? window.location.protocol : 'http:') + u; // //host -> https?//host
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(u)) return (typeof window !== 'undefined' ? window.location.protocol : 'http:') + '//' + u; // host:port -> http://host:port
  return String(u).replace(/\/+$/, '');
}
const API = normalizeApi(RAW_API);

// Utility function for authenticated API calls (same as App.jsx)
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

export default function ClubGate({ user, onJoin, onCreate }) {
  const [code, setCode] = useState('');
  const [clubName, setClubName] = useState('');
  const [busy, setBusy] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    setLoading(true);
    try {
      // Load user's invitations
      const invitesRes = await makeAuthenticatedRequest(`${API}/me/invitations`);
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvitations(invitesData.filter(inv => inv.status === 'pending'));
      }

      // Load user's pending requests
      const requestsRes = await makeAuthenticatedRequest(`${API}/me/club-requests`);
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(requestsData.filter(req => req.status === 'pending'));
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function join() {
    if (!code) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/clubs/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: code.trim(), userId: user.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'request already pending') {
          alert('Your request to join this club is already pending approval.');
          loadUserData(); // Refresh to show the new request
        } else {
          alert(data.error || 'Join failed');
        }
        return;
      }
      
      if (data.status === 'approved') {
        onJoin(data.club);
      } else if (data.status === 'pending') {
        alert('Your request has been sent to the club manager for approval.');
        loadUserData(); // Refresh to show the new request
        setCode(''); // Clear the code input
      }
    } finally { setBusy(false); }
  }

  async function create() {
    if (!clubName) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/clubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: clubName.trim(), managerId: user.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data.error || 'Create failed');
      onCreate(data);
    } finally { setBusy(false); }
  }

  async function handleInvitation(inviteId, action) {
    setBusy(true);
    try {
      const res = await makeAuthenticatedRequest(`${API}/me/invitations/${inviteId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return alert(data.error || `Failed to ${action} invitation`);
      }
      
      if (action === 'accept') {
        // Refresh the page or redirect to load the joined club
        window.location.reload();
      } else {
        // Just refresh the invitations list
        loadUserData();
      }
    } finally { setBusy(false); }
  }

  function goBack() {
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 relative">
      <div className="absolute top-4 left-4 flex gap-2">
        <button onClick={goBack} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">Back</button>
        <a href="/" className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">Home</a>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Join Club Section */}
        <div className="rounded-xl bg-white shadow p-4">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Join a club</h3>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Enter club code"
              value={code}
              onChange={(e)=>setCode(e.target.value)}
            />
            <button
              className="px-3 py-2 rounded-lg bg-indigo-500 text-white disabled:opacity-60"
              onClick={join}
              disabled={!code || busy}
            >Join</button>
          </div>
        </div>

        {/* Create Club Section (Managers Only) */}
        {user?.role === 'manager' && (
          <div className="rounded-xl bg-white shadow p-4">
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Create a club</h3>
              <input
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Club name"
                value={clubName}
                onChange={(e)=>setClubName(e.target.value)}
              />
              <button
                className="px-3 py-2 rounded-lg bg-indigo-500 text-white disabled:opacity-60"
                onClick={create}
                disabled={!clubName || busy}
              >Create</button>
            </div>
          </div>
        )}

        {/* Pending Club Invitations */}
        <div className="rounded-xl bg-white shadow p-4">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Club Invitations</h3>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : invitations.length === 0 ? (
              <div className="text-gray-500">No pending invitations</div>
            ) : (
              <div className="space-y-3">
                {invitations.map(invitation => (
                  <div key={invitation.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{invitation.club_name}</div>
                        <div className="text-sm text-gray-500">
                          Invited {new Date(invitation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="px-2 py-1 text-sm rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-60"
                          onClick={() => handleInvitation(invitation.id, 'accept')}
                          disabled={busy}
                        >
                          Accept
                        </button>
                        <button
                          className="px-2 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
                          onClick={() => handleInvitation(invitation.id, 'decline')}
                          disabled={busy}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Join Requests */}
        <div className="rounded-xl bg-white shadow p-4">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Pending Requests</h3>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="text-gray-500">No pending requests</div>
            ) : (
              <div className="space-y-3">
                {requests.map(request => (
                  <div key={request.id} className="border rounded-lg p-3">
                    <div className="font-medium">{request.club_name}</div>
                    <div className="text-sm text-gray-500">
                      Requested {new Date(request.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-orange-600 mt-1">
                      Waiting for manager approval
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
