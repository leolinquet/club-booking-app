import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from "./Navbar";
import './styles/theme.css';
import './styles/ui.css';
// removed a2hs (add-to-home-screen) to hide the Install App button in the navbar
import JoinRequired from './components/JoinRequired.jsx';
import LookingPanel from './LookingPanel.jsx';
import RequestsPeopleModal from './RequestsPeopleModal.jsx';
import ConversationsModal from './ConversationsModal.jsx';
import FeedbackModal from './FeedbackModal.jsx';
import FeedbackAdmin from './FeedbackAdmin.jsx';
import FloatingHelpButton from './FloatingHelpButton.jsx';
import { PageLoaderOverlay } from './components/ui/PageLoaderOverlay';
import { Skeleton, SkeletonCard, SkeletonText } from './components/ui/Skeleton';
import { useFetch } from './hooks/useFetch';
import LandingPage from './pages/LandingPage.jsx';
import AboutPage from './pages/marketing/AboutPage.jsx';
import BlogPage from './pages/marketing/BlogPage.jsx';
import ContactPage from './pages/marketing/ContactPage.jsx';
import HelpCenterPage from './pages/marketing/HelpCenterPage.jsx';
import HelpArticlePage from './pages/marketing/HelpArticlePage.jsx';
import SystemStatusPage from './pages/marketing/SystemStatusPage.jsx';
import CommunityPage from './pages/marketing/CommunityPage.jsx';
import PrivacyPage from './pages/marketing/PrivacyPage.jsx';
import TermsPage from './pages/marketing/TermsPage.jsx';
import SecurityPage from './pages/marketing/SecurityPage.jsx';
import CookiePage from './pages/marketing/CookiePage.jsx';
import HelpPage from './pages/marketing/HelpPage.jsx';
import ComingSoonPage from './pages/marketing/ComingSoonPage.jsx';

const safeParse = (s) => {
  try { return JSON.parse(s); } catch { return null; }
};

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

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5051';

const API = (() => {
  // runtime-resolved API base (preferred). Fall back to Vite env or hardcoded localhost.
  const runtimeBase = typeof window !== 'undefined' ? window.API_BASE : '';
  const envBase = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_API_BASE || '') : '';
  let base = runtimeBase || envBase || 'http://localhost:5051';

  // If hosted on Render, prefer the Render API URL unless explicitly overridden
  try {
    const h = typeof window !== 'undefined' ? window.location.hostname : '';
    if (/\.onrender\.com$/i.test(h) && (!runtimeBase || /localhost/.test(runtimeBase))) {
      base = 'https://club-booking-app.onrender.com';
      if (typeof window !== 'undefined') window.API_BASE = base;
    }
  } catch (e) {
    // ignore
  }

  // Normalize base to a full absolute URL so fetch(`${API}${path}`) is always valid.
  function normalize(u) {
    if (!u) return 'http://localhost:5051';
    // :5051  -> http://localhost:5051
    if (/^:\d+$/.test(u)) return 'http://localhost' + u;
    // //host  -> use current protocol
    if (/^\/\//.test(u)) return (typeof window !== 'undefined' ? window.location.protocol : 'http:') + u;
    // host:port or host without protocol -> add current protocol
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(u)) {
      return (typeof window !== 'undefined' ? window.location.protocol : 'http:') + '//' + u;
    }
    return u;
  }

  const final = normalize(String(base));
  // helpful debug: show the resolved API base in the browser console during development
  try { if (typeof window !== 'undefined' && import.meta.env?.MODE === 'development') console.debug('Resolved API base ->', final); } catch (e) {}
  return final;
})();

async function j(path, opts = {}) {
  // Use the runtime-resolved API base (handles onrender-hosted pages)
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'include',
    ...opts,
  });
  const data = await res.json().catch(() => null);
  return { res, data };
}

function Card({ children }) {
  return <div className="bg-white rounded-xl shadow p-4">{children}</div>;
}
// Small helper to show a club code with a copy button
function CodeWithCopy({ code }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(String(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // fallback: prompt the user to copy manually
      try { window.prompt('Copy the club code', String(code)); } catch { /* ignore */ }
    }
  };
  return (
    <span className="inline-flex items-center gap-2 text-gray-600 text-xs">
      <span>code {code || '—'}</span>
      <button
        onClick={doCopy}
        title="Copy club code"
        className={`copy-btn ${copied ? 'copied' : ''}`}
        type="button"
      >
        <div className="copy-effect"></div>
        <svg className="copy-svg-icon" viewBox="0 0 24 24" fill="none">
          {copied ? (
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          ) : (
            <path d="M16 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H8M16 4C16 2.89543 15.1046 2 14 2H10C8.89543 2 8 2.89543 8 4M16 4C16 5.10457 15.1046 6 14 6H10C8.89543 6 8 5.10457 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
        <span className="copy-text">{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </span>
  );
}
function Button({ children, ...props }) {
  return <button className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-50" {...props}>{children}</button>;
}

function LogoutButton({ onClick }) {
  return (
    <button className="logout-btn" onClick={onClick}>
      <div className="logout-sign">
        <svg viewBox="0 0 512 512">
          <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
        </svg>
      </div>
      <div className="logout-text">Logout</div>
    </button>
  );
}

function SetActiveButton({ isActive, onClick }) {
  return (
    <label className="set-active-container">
      <input type="checkbox" checked={isActive} onChange={onClick} />
      <span className="set-active-checkmark">
        <svg className="set-active-icon set-active-no" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="set-active-name set-active-no">Set Active</span>
        
        <svg className="set-active-icon set-active-yes" viewBox="0 0 24 24" fill="none">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="set-active-name set-active-yes">Active</span>
      </span>
    </label>
  );
}

function SendButton({ onClick, disabled, children = "Send" }) {
  return (
    <button className="send-btn" onClick={onClick} disabled={disabled}>
      <div className="send-svg-wrapper">
        <svg className="send-btn-svg" viewBox="0 0 24 24" fill="none">
          <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="send-btn-span">{children}</span>
    </button>
  );
}
function TextInput(props) {
  return <input {...props} className={"border rounded-lg px-3 py-2 w-full "+(props.className||'')} />;
}
function Select(props) {
  return <select {...props} className={"border rounded-lg px-3 py-2 w-full "+(props.className||'')} />;
}

// Main authenticated app component
function AuthenticatedApp() {
  // Simple debounce function to prevent rapid successive calls
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  const [user, setUser] = useState(() => safeParse(localStorage.getItem('user')));
  const [club, setClub] = useState(null); // Don't initialize from localStorage here - we'll load it based on user
  const [userClubs, setUserClubs] = useState([]); // List of clubs user belongs to
  const [view, setView] = useState('book'); // 'book' | 'clubs' | 'home' | 'tournaments' | 'rankings' | 'feedback-admin'
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const [selectedClubForModal, setSelectedClubForModal] = useState(null);
  const [appLoading, setAppLoading] = useState(true); // App initialization loading

  // Helper functions for user-specific localStorage
  function getUserClubKey(userId) {
    return `activeClub:${userId}`;
  }

  function saveUser(u){ setUser(u); localStorage.setItem('user', JSON.stringify(u)); }
  
  function saveClub(c, userId = user?.id){ 
    setClub(c); 
    if (userId) {
      localStorage.setItem(getUserClubKey(userId), JSON.stringify(c));
      // Update backend with active club
      updateActiveClubOnServer(c, userId);
    }
  }

  function loadUserClub(userId) {
    if (!userId) return null;
    return safeParse(localStorage.getItem(getUserClubKey(userId)));
  }

  function clearUserClub(userId) {
    if (userId) {
      localStorage.removeItem(getUserClubKey(userId));
    }
  }

  // Update active club on server
  async function updateActiveClubOnServer(clubData, userId) {
    try {
      await fetch(`${API}/users/me/active-club`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ clubId: clubData?.id })
      });
    } catch (e) {
      console.warn('Failed to update active club on server:', e);
    }
  }

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(()=>null);
    } catch {}
    
    // Clear user-specific data
    if (user?.id) {
      clearUserClub(user.id);
    }
    
    // Clean up old global keys if they exist
    localStorage.removeItem('club');
    localStorage.removeItem('activeClubId');
    
    localStorage.removeItem('user');
    localStorage.removeItem('authToken'); // Clear JWT token
    setUser(null);
    setClub(null); // Clear active club
    setUserClubs([]); // Clear club memberships
    setView('book');
  };

  // Single canonical handler for successful auth (used by Auth component)
  async function handleAuthed(u) {
    // Persist user and update state
    console.debug('handleAuthed: setting user', u && u.id);
    saveUser(u);

    // Clean up old global localStorage keys
    localStorage.removeItem('club');
    localStorage.removeItem('activeClubId');

    // Load user's specific active club from localStorage first
    const savedClub = loadUserClub(u.id);
    
    // load club(s) with credentials so the server sees the authenticated cookie/session
    try {
      const r = await fetch(`${API}/users/${u.id}/clubs`, { credentials: 'include' });
      if (r.ok) {
        const clubs = await r.json().catch(()=>[]);
        setUserClubs(clubs); // Store user's club memberships
        
        // If user has a saved club and it's still in their clubs list, use it
        if (savedClub && clubs.some(c => c.id === savedClub.id)) {
          setClub(savedClub);
          setView('book');
        } 
        // Otherwise, try to get their active club from the server
        else if (clubs && clubs.length) {
          try {
            const activeClubResponse = await fetch(`${API}/users/me/active-club`, { credentials: 'include' });
            if (activeClubResponse.ok) {
              const activeClubData = await activeClubResponse.json().catch(() => null);
              const activeClub = activeClubData && clubs.find(c => c.id === activeClubData.id);
              if (activeClub) {
                saveClub(activeClub, u.id);
                setView('book');
              } else {
                // Fall back to first club
                saveClub(clubs[0], u.id);
                setView('book');
              }
            } else {
              // Fall back to first club if server call fails
              saveClub(clubs[0], u.id);
              setView('book');
            }
          } catch (e) {
            // Fall back to first club if server call fails
            saveClub(clubs[0], u.id);
            setView('book');
          }
        }
      } else {
        setUserClubs([]); // No clubs found or error
      }
    } catch (e) {
      // ignore failures; UI will keep working with persisted user
      setUserClubs([]); // Reset clubs on error
    } finally {
      setAppLoading(false); // Hide loader after auth and club loading
    }
  }
  
  // Load user's active club when user changes (including on app startup)
  useEffect(() => {
    if (!user?.id) {
      setClub(null);
      setAppLoading(false);
      return;
    }

    // Clean up old global localStorage keys
    localStorage.removeItem('club');
    localStorage.removeItem('activeClubId');

    // Load user's specific active club from localStorage
    const savedClub = loadUserClub(user.id);
    if (savedClub) {
      setClub(savedClub);
      setAppLoading(false);
      return;
    }

    // If no saved club, try to get from server
    (async () => {
      try {
        const r = await fetch(`${API}/users/me/active-club`, { credentials: 'include' });
        if (r.ok) {
          const activeClubData = await r.json().catch(() => null);
          if (activeClubData && activeClubData.id) {
            setClub(activeClubData);
            saveClub(activeClubData, user.id);
          }
        }
      } catch (e) {
        console.warn('Failed to load active club from server:', e);
      } finally {
        setAppLoading(false);
      }
    })();
  }, [user?.id]);

  // Load user's club memberships when user loads
  useEffect(() => {
    (async () => {
      if (!user || !user.id) {
        setAppLoading(false); // No user, stop loading
        return;
      }
      try {
        const r = await fetch(`${API}/users/${user.id}/clubs`, { credentials: 'include' });
        if (r.ok) {
          const clubs = await r.json().catch(() => []);
          setUserClubs(clubs);
        } else {
          setUserClubs([]);
        }
      } catch (e) {
        setUserClubs([]);
      } finally {
        setAppLoading(false); // Hide loader when done
      }
    })();
  }, [user?.id]);

  // Announcements (in-app messages) - moved above early returns so hooks stay stable
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Chat functionality
  const [showConversations, setShowConversations] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const conversationsModalRef = useRef();
  
  // Feedback functionality
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Looking-for-partner feature
  const [showLooking, setShowLooking] = useState(false);
  const [lookingList, setLookingList] = useState([]);
  const [myLooking, setMyLooking] = useState(false);
  const [lookingBusy, setLookingBusy] = useState(false);
  // Track outgoing request statuses per player_id
  const [pendingRequests, setPendingRequests] = useState({}); // { [player_id]: 'pending'|'accepted'|'declined' }
  // Simulated recipient panel state (QA helper / cross-tab mocked behavior)
  const [simRecipient, setSimRecipient] = useState(null);
  const [showSimRecipient, setShowSimRecipient] = useState(false);

  const loadAnnouncements = async () => {
    if (!user || !user.id) return;
    try {
      const r = await fetch(`${API}/users/${user.id}/announcements`, { credentials: 'include' });
      if (!r.ok) return;
      const data = await r.json().catch(() => null);
      if (!Array.isArray(data)) return;
      // Normalize server rows to a stable client-side shape:
      // server returns: { ua_id, read, read_at, announcement_id, title, body, created_at, send_push }
      const norm = data.map(a => ({
        id: Number(a.announcement_id ?? a.id ?? a.announcementId),
        title: a.title ?? '',
        body: a.body ?? '',
        read: !!a.read,
        created_at: a.created_at || a.created || a.ts || null
      }));
      setAnnouncements(norm);
      setUnreadCount(norm.filter(a => !a.read).length);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadAnnouncements();
    // poll every 15s for announcements (more frequent)
    const id = setInterval(() => { loadAnnouncements(); }, 15000);
    return () => clearInterval(id);
  }, [user?.id]);

  // Function to refresh conversations list
  const refreshConversations = () => {
    if (conversationsModalRef.current) {
      conversationsModalRef.current.refreshConversations();
    }
    // Also refresh unread count when conversations change
    loadUnreadMessageCount();
  };

  // Load unread message count with debouncing to prevent rapid successive calls
  const loadUnreadMessageCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API}/api/chat/unread-count`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMessageCount(data.unread_count || 0);
      }
    } catch (e) {
      console.error('Failed to load unread message count:', e);
    }
  }, [user?.id, API]);

  // Debounced version to prevent rapid successive calls
  const debouncedLoadUnreadMessageCount = useCallback(
    debounce(loadUnreadMessageCount, 500),
    [loadUnreadMessageCount]
  );

  useEffect(() => {
    loadUnreadMessageCount();
    // Poll for unread messages every 15 seconds (consistent with announcements)
    const id = setInterval(() => { loadUnreadMessageCount(); }, 15000);
    return () => clearInterval(id);
  }, [user?.id, loadUnreadMessageCount]);

  // Fetch list of players looking for partner in current club
  const loadLooking = async () => {
    if (!club) return;
    try {
      const { res, data } = await j(`/clubs/${club.id}/looking`);
      if (!res.ok) return setLookingList([]);
      setLookingList(Array.isArray(data) ? data : []);
      // also check whether current user is marked (if present in list)
      const me = (data || []).find(p => p.user_id && user && Number(p.user_id) === Number(user.id));
      setMyLooking(!!me);
    } catch (e) {
      setLookingList([]);
    }
  };

  // Listen for presence updates emitted from LookingPanel or other tabs
  useEffect(() => {
    const onCustom = (e) => {
      try {
        const d = e.detail || {};
        if (!d || !d.clubId) return;
        if (club && String(club.id) === String(d.clubId)) {
          // reload looking list so count updates
          loadLooking();
        }
      } catch (err) {}
    };
    const onStorage = (e) => {
      try {
        if (!e.key) return;
        if (String(e.key).startsWith(`club_booking_looking:${club?.id}:`)) {
          loadLooking();
        }
      } catch (err) {}
    };
    window.addEventListener('club_booking_looking_change', onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('club_booking_looking_change', onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, [club?.id, user?.id]);

  // Centralized storage listener to detect incoming mocked requests (for recipient simulation)
  useEffect(() => {
    const onStorage = (e) => {
      try {
        if (!e.key || !e.newValue) return;
        const key = String(e.key);
        // request keys look like: club_booking_request:<recipientUserId>:<reqId>
        if (key.startsWith('club_booking_request:')) {
          const parts = key.split(':');
          const recipientId = parts[1];
          // If the current user is the recipient, show the simulated recipient panel
          if (user && String(user.id) === String(recipientId)) {
            const payload = JSON.parse(e.newValue || '{}');
            setSimRecipient({ player: payload.player || { player_id: payload.player_id }, from: payload.fromName || payload.from || 'Someone', reqId: payload.reqId });
            setShowSimRecipient(true);
          }
        }
        // responses: club_booking_response:<requesterUserId>:<reqId>
        if (key.startsWith('club_booking_response:')) {
          const payload = JSON.parse(e.newValue || '{}');
          if (payload && payload.player_id) {
            setPendingRequests(prev => ({ ...prev, [payload.player_id]: payload.status }));
          }
        }
      } catch (err) {
        // ignore malformed storage entries
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user?.id]);

  const toggleLooking = async (value) => {
    if (!user || !club) return;
    setLookingBusy(true);
    try {
      const payload = { userId: user.id };
      if (typeof value === 'boolean') payload.looking = value;
      const r = await fetch(`${API}/clubs/${club.id}/looking`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(payload)
      });
      const d = await r.json().catch(()=>null);
      if (!r.ok) return alert(d?.error || 'Failed');
      setMyLooking(!!d.looking);
      await loadLooking();
    } finally { setLookingBusy(false); }
  };

  const createAnnouncement = async ({ title, body }) => {
    if (!club || !user) return alert('Missing club or user');
    try {
      const r = await fetch(`${API}/announcements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // server expects managerId (not userId)
        body: JSON.stringify({ clubId: club.id, managerId: user.id, title, body })
      });
      const d = await r.json().catch(()=>null);
      if (!r.ok) return alert(d?.error || 'Failed to create announcement');
      await loadAnnouncements();
      return true;
    } catch (e) {
      alert('Failed to create announcement');
      return false;
    }
  };

  const markAnnouncementRead = async (announcementId) => {
    if (!user) return;
    try {
      await fetch(`${API}/users/${user.id}/announcements/${announcementId}/read`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ userId: user.id })
      });
      // optimistic update
      setAnnouncements(prev => prev.map(a => (Number(a.id) === Number(announcementId) ? { ...a, read: true } : a)));
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Also refresh from server to ensure accurate count
      await loadAnnouncements();
    } catch (e) {
      // ignore
    }
  };

  if (!user || !user.id) {
    return (
      <div>
        <PageLoaderOverlay isVisible={appLoading} message="Initializing app..." />
        
        {/* Header with Logo */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
            <a
              href="/"
              className="text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black/20 rounded px-1 hover:text-gray-600 transition-colors"
              aria-label="Go to landing page"
            >
              SportsClubNet
            </a>
          </div>
        </header>

        {/* Main Content with Auth - Full viewport height minus header */}
        <div className="min-h-[calc(100vh-3.5rem)] grid place-items-center p-4">
          <Auth onLogin={handleAuthed} onRegister={handleAuthed} />
        </div>

        {/* Footer Navigation - Below the viewport */}
        <footer className="bg-gray-900">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
                <ul role="list" className="mt-4 space-y-3">
                  <li>
                    <a href="/#features" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="/#how-it-works" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a href="/app" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      Demo
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                <ul role="list" className="mt-4 space-y-3">
                  <li>
                    <a href="/about" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="/blog" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="/contact" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Resources</h3>
                <ul role="list" className="mt-4 space-y-3">
                  <li>
                    <a href="/help-center" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="/status" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      Status
                    </a>
                  </li>
                  <li>
                    <a href="/community" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      Community
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                <ul role="list" className="mt-4 space-y-3">
                  <li>
                    <a href="/privacy" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="/terms" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="/security" className="text-sm leading-6 text-gray-300 hover:text-white transition-colors duration-200">
                      Security
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-xs leading-5 text-gray-400">
                &copy; 2024 SportsClubNet. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Manager flag + page guard
  const isManager = user.role === 'manager';
  const effectivePage = isManager ? view : (view === 'home' ? 'book' : view);

  // Debug logging
  console.log('App render state:', { user: user?.display_name, club: club?.name, userClubs: userClubs.length });

  return (
    <>
      <PageLoaderOverlay isVisible={appLoading} message="Loading your clubs..." />
      <div className="safe-padded min-h-screen flex flex-col mobile-safe">
      <Navbar
        onBook={() => setView('book')}
        onHome={() => setView('home')}
        onOpenConversations={() => setShowConversations(true)}
        onOpenAnnouncements={() => setShowAnnouncements(true)}
        onOpenFeedback={() => setShowFeedback(true)}
        onFeedbackAdmin={() => setView('feedback-admin')}
        onClubs={() => setView('clubs')}
        onTournaments={() => setView('tournaments')}
        onRankings={() => setView('rankings')}
        isManager={isManager}
        user={user}
        onOpenLooking={() => {
          setShowLooking(true);
          if (userClubs.length > 0) {
            loadLooking();
          }
        }}
        lookingCount={lookingList.length}
        onLogout={async () => {
          try {
            // attempt to notify server (if route exists); don't block UI on failure
            await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(()=>null);
          } catch (e) {}
          // clear local user only so Auth screen renders immediately.
          // Preserve the active club in localStorage so it remains "sticky"
          // across logouts until the user explicitly changes it.
          localStorage.removeItem('user');
          localStorage.removeItem('authToken'); // Clear JWT token
          setUser(null);
          setUserClubs([]); // Clear club memberships
          setView('book');
        }}
        
        unreadCount={unreadCount}
        unreadMessageCount={unreadMessageCount}
      />
      {showAnnouncements && (
        userClubs.length === 0 ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Announcements</h2>
                <button onClick={() => setShowAnnouncements(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <JoinRequired viewName="announcements" onJoinClub={() => {setShowAnnouncements(false); setView('clubs');}} />
            </div>
          </div>
        ) : (
          <AnnouncementPanel
            user={user}
            club={club}
            isManager={isManager}
            announcements={announcements}
            onClose={() => setShowAnnouncements(false)}
            onRefresh={loadAnnouncements}
            onCreate={createAnnouncement}
            onMarkRead={markAnnouncementRead}
          />
        )
      )}
      {showLooking && (
        userClubs.length === 0 ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Looking for Games</h2>
                <button onClick={() => setShowLooking(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <JoinRequired viewName="looking for games" onJoinClub={() => {setShowLooking(false); setView('clubs');}} />
            </div>
          </div>
        ) : (
          <LookingPanel show={showLooking} onClose={() => setShowLooking(false)} user={user} club={club} />
        )
      )}
      {/* Mocked recipient confirmation panel (non-blocking) */}
      {showSimRecipient && simRecipient && (
        <div className="absolute right-6 bottom-6 z-60 pointer-events-auto">
          <div className="w-[360px] max-w-[95%] bg-white rounded-xl shadow p-4 border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Request received (mock)</h3>
              <button className="text-sm text-gray-500" onClick={() => { setShowSimRecipient(false); setSimRecipient(null); }}>Close</button>
            </div>

            <div className="mb-4">
              <div className="text-sm">{simRecipient.from} wants to hit with you — Accept or Decline?</div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => {
                  const pid = simRecipient.player.player_id;
                  setPendingRequests(prev => ({ ...prev, [pid]: 'accepted' }));
                  // write response to localStorage so requester tab can update
                  try {
                    const respKey = `club_booking_response:${simRecipient.player.user_id || simRecipient.player.player_id}:${simRecipient.reqId || String(Date.now())}`;
                    const payload = { reqId: simRecipient.reqId || null, player_id: pid, status: 'accepted' };
                    localStorage.setItem(respKey, JSON.stringify(payload));
                  } catch (e) { /* ignore */ }
                  setShowSimRecipient(false);
                  setSimRecipient(null);
                  alert('Request accepted (mock).');
                }} className="px-4 py-2 rounded bg-green-500 text-white">Accept</button>

                <button onClick={() => {
                  const pid = simRecipient.player.player_id;
                  setPendingRequests(prev => ({ ...prev, [pid]: 'declined' }));
                  try {
                    const respKey = `club_booking_response:${simRecipient.player.user_id || simRecipient.player.player_id}:${simRecipient.reqId || String(Date.now())}`;
                    const payload = { reqId: simRecipient.reqId || null, player_id: pid, status: 'declined' };
                    localStorage.setItem(respKey, JSON.stringify(payload));
                  } catch (e) { /* ignore */ }
                  setShowSimRecipient(false);
                  setSimRecipient(null);
                  alert('Request declined (mock).');
                }} className="px-4 py-2 rounded bg-red-100 text-red-700">Decline</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto p-4 space-y-6 flex-1 main-content pt-6">
        {effectivePage === 'clubs' ? (
          <ClubsPage
            user={user}
            club={club}
            onSetActive={(c) => { saveClub(c); setView('book'); }}
            onJoin={(c) => {setUserClubs(prev => prev.some(club => club.id === c.id) ? prev : [...prev, c]);}}
            onCreate={(c) => {setUserClubs(prev => prev.some(club => club.id === c.id) ? prev : [...prev, c]);}}
            onOpenManageModal={(c) => {
              setSelectedClubForModal(c);
              setRequestsModalOpen(true);
            }}
          />
        ) : effectivePage === 'home' ? (
          // Manager Dashboard - requires club membership
          userClubs.length === 0 ? (
            <JoinRequired viewName="manager dashboard" onJoinClub={() => setView('clubs')} />
          ) : !club ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Manager Home</h1>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span>{user?.display_name ?? user?.name ?? 'User'} ({user?.role ?? 'Member'})</span>
                  <span className="mx-2">•</span>
                  <span>{club?.name ?? 'Club'} </span>
                  <CodeWithCopy code={club?.code} />
                  <LogoutButton onClick={handleLogout} />
                </div>
              </header>
              <ManagerDashboard user={user} club={club} />
            </>
          )
        ) : effectivePage === 'tournaments' ? (
          // Tournaments - requires club membership
          userClubs.length === 0 ? (
            <JoinRequired viewName="tournaments" onJoinClub={() => setView('clubs')} />
          ) : !club ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Tournaments</h1>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span>{user?.display_name ?? user?.name ?? 'User'} ({user?.role ?? 'Member'})</span>
                  <span className="mx-2">•</span>
                  <span>{club?.name ?? 'Club'} </span>
                  <CodeWithCopy code={club?.code} />
                  <LogoutButton onClick={handleLogout} />
                </div>
              </header>
              {/* ⬇️ Use the component we added earlier */}
              <TournamentsView API={API} club={club} user={user} isManager={isManager} />
            </>
          )
        ) : effectivePage === 'rankings' ? (
          // Rankings - requires club membership
          userClubs.length === 0 ? (
            <JoinRequired viewName="rankings" onJoinClub={() => setView('clubs')} />
          ) : !club ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Rankings</h1>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span>{user?.display_name ?? user?.name ?? 'User'} ({user?.role ?? 'Member'})</span>
                  <span className="mx-2">•</span>
                  <span>{club?.name ?? 'Club'} </span>
                  <CodeWithCopy code={club?.code} />
                  <LogoutButton onClick={handleLogout} />
                </div>
              </header>
              <RankingsView API={API} club={club} user={user} isManager={isManager} />
            </>
          )
        ) : effectivePage === 'feedback-admin' ? (
          // Feedback Admin - requires manager permissions
          <FeedbackAdmin user={user} API={API} />
        ) : (
          // Book view (default) - requires club membership
          userClubs.length === 0 ? (
            <JoinRequired viewName="court booking" onJoinClub={() => setView('clubs')} />
          ) : !club ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Book</h1>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span>{user?.display_name ?? user?.name ?? 'User'} ({user?.role ?? 'Member'})</span>
                  <span className="mx-2">•</span>
                  <span>{club?.name ?? 'Club'} </span>
                  <CodeWithCopy code={club?.code} />
                  <LogoutButton onClick={handleLogout} />
                </div>
              </header>
              <UserBooking user={user} club={club} />
            </>
          )
        )}
      </div>

      {/* Requests & People Modal */}
      <RequestsPeopleModal
        club={selectedClubForModal}
        isOpen={requestsModalOpen}
        onClose={() => {
          setRequestsModalOpen(false);
          setSelectedClubForModal(null);
        }}
        isManager={selectedClubForModal && Number(selectedClubForModal.manager_id) === Number(user?.id)}
        user={user}
        API={API}
        onConversationUpdate={refreshConversations}
      />

      {/* Conversations Modal */}
      <ConversationsModal
        ref={conversationsModalRef}
        isOpen={showConversations}
        onClose={() => setShowConversations(false)}
        user={user}
        API={API}
        onUnreadCountChange={debouncedLoadUnreadMessageCount}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        user={user}
        userClubs={userClubs}
        currentClub={club}
        API={API}
      />

      {/* Floating Help Button (mobile only) */}
      <FloatingHelpButton onClick={() => setShowFeedback(true)} />
    </div>
    </>
  );
}

// Main App component with routing
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Marketing landing page - no auth required */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Marketing pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help-center" element={<HelpCenterPage />} />
        <Route path="/help-center/article/:articleId" element={<HelpArticlePage />} />
        <Route path="/status" element={<SystemStatusPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/cookies" element={<CookiePage />} />
        <Route path="/help" element={<HelpPage />} />
        
        {/* Coming soon pages */}
        <Route path="/status" element={<ComingSoonPage title="System Status" description="System status and uptime information will be available here." />} />
        <Route path="/community" element={<ComingSoonPage title="Community" description="Connect with other club managers in our community forum, coming soon!" />} />
        
        {/* Authenticated app routes */}
        <Route path="/app/*" element={<AuthenticatedApp />} />
        <Route path="/book" element={<Navigate to="/app" replace />} />
        <Route path="/clubs" element={<Navigate to="/app" replace />} />
        <Route path="/tournaments" element={<Navigate to="/app" replace />} />
        <Route path="/rankings" element={<Navigate to="/app" replace />} />
        <Route path="/home" element={<Navigate to="/app" replace />} />
        
        {/* Auth routes */}
        <Route path="/login" element={<Navigate to="/app" replace />} />
        <Route path="/signup" element={<Navigate to="/app" replace />} />
        <Route path="/demo" element={<Navigate to="/app" replace />} />
        
        {/* Catch-all redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

/* -------------------- No Club View -------------------- */

/* -------------------- Announcement Panel -------------------- */
function AnnouncementPanel({ user, club, isManager, announcements = [], onClose, onRefresh, onCreate, onMarkRead }){
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !body.trim()) return alert('Title and body required');
    setBusy(true);
    try {
      const ok = await onCreate({ title: title.trim(), body: body.trim() });
      if (ok) { setTitle(''); setBody(''); }
      await onRefresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl lg:max-w-5xl bg-white rounded-xl shadow-lg max-h-[90vh] flex flex-col">
        <div className="announcements-content p-6 flex-1 min-h-0 flex flex-col">
          <div className="announcements-header flex items-center justify-between mb-4 pb-4 border-b flex-shrink-0">
            <h3 className="text-xl font-semibold text-gray-900">Announcements</h3>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium" onClick={async ()=>{ await onRefresh(); }}>Refresh</button>
              <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium" onClick={onClose}>Close</button>
            </div>
          </div>

          <div className="announcements-grid grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            {isManager && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4 flex-shrink-0">
                <div className="text-sm font-semibold mb-3 text-gray-900">Create announcement</div>
                <input className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
                <textarea className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={5} placeholder="Message" value={body} onChange={e=>setBody(e.target.value)} />
                <div className="flex justify-end gap-3">
                  <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium" onClick={()=>{ setTitle(''); setBody(''); }}>Reset</button>
                  <SendButton onClick={submit} disabled={busy}>Send</SendButton>
                </div>
              </div>
            )}

            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
              {announcements.length === 0 && <div className="text-sm text-gray-500 p-4 text-center">No announcements.</div>}
              {announcements.map(a => (
                <div key={a.id} className={`border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow ${a.read ? 'bg-white' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="font-semibold text-gray-900">{a.title}</div>
                    <div className="text-xs text-gray-500">{new Date(a.created_at || a.created || a.ts || Date.now()).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{a.body}</div>
                  <div className="flex items-center gap-2">
                    {!a.read && <button className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors" onClick={()=> onMarkRead(a.id)}>Mark read</button>}
                    {a.read && <span className="text-xs text-gray-500 italic">Read</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2">About</div>
            <div className="text-sm text-gray-700">Announcements are in-app messages stored per-club. Only managers can create announcements for their club. Users will see unread messages highlighted.</div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Auth (Login / Register) -------------------- */
export function Auth({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [username, setUsername] = useState(""); // email OR username
  const [email, setEmail] = useState("");       // only used in register
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset app loading state when auth component mounts
  useEffect(() => {
    // Small delay to ensure the app loading state is properly reset
    const timer = setTimeout(() => {
      // This ensures the PageLoaderOverlay disappears when auth is shown
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // LOGIN: send { login: <email or username>, password }
  const doLogin = async () => {
    console.log('doLogin invoked', { username });
    setBusy(true);
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          login: username.trim(),       // <-- send the username/email string
          password,
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) {
        console.error('login failed', { status: r.status, data });
        return alert((data && data.error) || "Login failed");
      }

      // Store JWT token in localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }

      // backend returns { ok:true, user, token }
      onLogin?.(data.user || { id: data.user_id });
    } catch (e) {
      console.error('doLogin error', e);
      alert('Login failed: ' + (e && e.message ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  // REGISTER: send { email, password, name }
  const doRegister = async () => {
    setBusy(true);
    try {
      const name =
        (username && username.trim()) ||
        (email && email.split("@")[0]) ||
        "";

      const r = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
          name,                         // <-- backend expects "name"
        }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok) return alert((data && data.error) || "Signup failed");

      alert("We sent a verification email. Verify, then log in.");
  setMode("login");
  // Call onRegister with the actual user object when available so the
  // app's handleAuthed() receives a user with `id` and can immediately
  // fetch the user's clubs. Server returns { user: { ... } } on success.
  onRegister?.(data && data.user ? data.user : data);
    } finally {
      setBusy(false);
    }
  };

  const canLogin = username.trim() && password;
  const canRegister = username.trim() && email.trim() && password;

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="auth-form">
        <div className="form">
          <h2 className="title">
            {mode === "login" ? "Log in" : "Create account"}
          </h2>
          <p className="subtitle">
            {mode === "login" ? "Welcome back!" : "Join us today"}
          </p>

          {/* Login: label as "Email or Username" */}
          <div className="form-container">
            <input
              className="input"
              type="text"
              name="login"
              autoComplete="username"
              placeholder="Email or Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Only show Email input in register mode */}
          {mode === "register" && (
            <div className="form-container">
              <input
                className="input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="form-container">
            <input
              className="input"
              type="password"
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === "login" ? (
            <>
              <button onClick={doLogin} disabled={!canLogin || busy}>
                Log in
              </button>
              <div className="form-section">
                Don’t have an account?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); setMode("register"); }}>
                  Create one
                </a>
              </div>
            </>
          ) : (
            <>
              <button onClick={doRegister} disabled={!canRegister || busy}>
                Create account
              </button>
              <div className="form-section">
                Already have an account?{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); }}>
                  Log in
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Manager Home (Dashboard) -------------------- */
function ManagerDashboard({ user, club }){
  const [sports, setSports] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [form, setForm] = useState({
    sportChoice: 'tennis',      // 'tennis' | ... | '__custom__'
    customSport: '',
    courts: 4,
    openHour: 8,
    closeHour: 22,
    slotChoice: 60,             // 30 | 45 | 60 | 90 | 120 | '__custom__'
    customMinutes: ''
  });

  const actualSport = form.sportChoice === '__custom__'
    ? form.customSport.trim()
    : form.sportChoice;

  const actualMinutes = form.slotChoice === '__custom__'
    ? Number(form.customMinutes)
    : Number(form.slotChoice);

  const load = async ()=> {
    setLoading(true);
    try {
      const r = await fetch(`${API}/clubs/${club.id}/sports`, { credentials: 'include' });
      const data = await r.json().catch(() => null);
      if (!r.ok || !Array.isArray(data)) {
        setSports([]);
      } else {
        setSports(data);
      }
    } catch (e) {
      console.error('Error loading sports:', e);
      setSports([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{ load(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      sportChoice: 'tennis',
      customSport: '',
      courts: 4,
      openHour: 8,
      closeHour: 22,
      slotChoice: 60,
      customMinutes: ''
    });
  };

  const save = async ()=> {
    if (!actualSport) return alert('Please enter a sport name');
    if (!actualMinutes || actualMinutes < 5 || actualMinutes > 240) {
      return alert('Time slots must be between 5 and 240 minutes.');
    }

    const payload = {
      userId: user.id,
      sport: actualSport,
      courts: Number(form.courts),
      openHour: Number(form.openHour),
      closeHour: Number(form.closeHour),
      slotMinutes: actualMinutes,
    };

    const url = editingId
      ? `${API}/clubs/${club.id}/sports/${editingId}`
      : `${API}/clubs/${club.id}/sports`;

    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(()=>null);
    if (!res.ok) return alert((data && data.error) || 'Save failed');

    await load();
    resetForm();
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({
      sportChoice: ['tennis','basketball','football','soccer','pickleball','padel','badminton','volleyball'].includes(s.sport.toLowerCase())
        ? s.sport.toLowerCase()
        : '__custom__',
      customSport: ['tennis','basketball','football','soccer','pickleball','padel','badminton','volleyball'].includes(s.sport.toLowerCase()) ? '' : s.sport,
      courts: s.courts,
      openHour: s.open_hour,
      closeHour: s.close_hour,
      slotChoice: [30,45,60,90,120].includes(s.slot_minutes) ? s.slot_minutes : '__custom__',
      customMinutes: [30,45,60,90,120].includes(s.slot_minutes) ? '' : String(s.slot_minutes)
    });
  };

  const remove = async (s) => {
    const yes = confirm(`Delete ${s.sport}? This will remove its booking grid (existing bookings remain).`);
    if (!yes) return;
    const res = await fetch(`${API}/clubs/${club.id}/sports/${s.id}`, {
      method:'DELETE',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId: user.id })
    });
    const data = await res.json().catch(()=>null);
    if (!res.ok) return alert((data && data.error) || 'Delete failed');
    await load();
    if (editingId === s.id) resetForm();
  };

  // preset options + custom
  const SPORT_PRESETS = ['tennis','basketball','football','soccer','pickleball','padel','badminton','volleyball'];
  const SLOT_PRESETS  = [30,45,60,90,120];

  return (
    <div className="space-y-4">
      {/* ===== Card 1: Add/Edit sport form ===== */}
      <Card>
        <h3 className="text-lg font-medium mb-3">
          {editingId ? 'Edit sport' : 'Add a sport'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
          {/* Sport */}
          <div>
            <label htmlFor="sportChoice" className="text-xs text-gray-600 mb-1 block">Sport</label>
            <Select
              id="sportChoice"
              value={form.sportChoice}
              onChange={e=>setForm(f=>({...f, sportChoice:e.target.value}))}
            >
              {SPORT_PRESETS.map(s => (
                <option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>
              ))}
              <option value="__custom__">Custom…</option>
            </Select>

            {form.sportChoice === '__custom__' && (
              <div className="mt-2">
                <label htmlFor="customSport" className="sr-only">Custom sport</label>
                <TextInput
                  id="customSport"
                  placeholder="Type sport name (e.g., Hockey)"
                  autoComplete="off"
                  inputMode="text"
                  value={form.customSport}
                  onChange={e=>setForm(f=>({...f, customSport:e.target.value}))}
                />
              </div>
            )}
          </div>

          {/* Courts */}
          <div>
            <label htmlFor="courts" className="text-xs text-gray-600 mb-1 block">Courts / Fields</label>
            <TextInput
              id="courts"
              type="number"
              inputMode="numeric"
              min={1}
              max={64}
              step={1}
              value={form.courts}
              onChange={e=>setForm({...form, courts:Number(e.target.value)})}
            />
          </div>

          {/* Open hour */}
          <div>
            <label htmlFor="openHour" className="text-xs text-gray-600 mb-1 block">Open time (0–23)</label>
            <TextInput
              id="openHour"
              type="number"
              inputMode="numeric"
              min={0}
              max={23}
              step={1}
              value={form.openHour}
              onChange={e=>setForm({...form, openHour:Number(e.target.value)})}
            />
          </div>

          {/* Close hour */}
          <div>
            <label htmlFor="closeHour" className="text-xs text-gray-600 mb-1 block">Closing time (1–24)</label>
            <TextInput
              id="closeHour"
              type="number"
              inputMode="numeric"
              min={1}
              max={24}
              step={1}
              value={form.closeHour}
              onChange={e=>setForm({...form, closeHour:Number(e.target.value)})}
            />
          </div>

          {/* Slot minutes */}
          <div>
            <label htmlFor="slotChoice" className="text-xs text-gray-600 mb-1 block">Time slots (minutes)</label>
            <Select
              id="slotChoice"
              value={form.slotChoice}
              onChange={e=>setForm(f=>({
                ...f,
                slotChoice: isNaN(+e.target.value) ? e.target.value : Number(e.target.value)
              }))}
            >
              {SLOT_PRESETS.map(m => <option key={m} value={m}>{m}</option>)}
              <option value="__custom__">Custom…</option>
            </Select>

            {form.slotChoice === '__custom__' && (
              <div className="mt-2">
                <label htmlFor="customMinutes" className="sr-only">Custom minutes</label>
                <TextInput
                  id="customMinutes"
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={240}
                  step={5}
                  placeholder="Minutes (5–240)"
                  value={form.customMinutes}
                  onChange={e=>setForm(f=>({...f, customMinutes:e.target.value}))}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <Button onClick={save}>{editingId ? 'Update' : 'Save'}</Button>
            {editingId && (
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* ===== Card 2: Configured sports list ===== */}
      <Card>
        <h3 className="text-lg font-medium mb-2">Configured sports</h3>
        <div className="grid gap-2">
          {loading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : sports.map(s => (
            <div key={s.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="text-sm">
                <div className="font-medium capitalize">{s.sport}</div>
                <div className="text-gray-600">
                  Courts {s.courts} • {s.open_hour}:00 - {s.close_hour}:00 • {s.slot_minutes} min
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="edit-btn inline-flex items-center justify-center px-4 py-2 bg-blue-600 ease-in-out delay-75 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
                  onClick={() => startEdit(s)}
                >
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"
                    ></path>
                  </svg>
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => remove(s)}
                >
                  <svg className="svgIcon" viewBox="0 0 448 512">
                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {!loading && sports.length===0 && (
            <div className="text-gray-500 text-sm">No sports yet. Add one above.</div>
          )}
        </div>
      </Card>
    </div>
  );
}



/* -------------------- Book (for both; managers have extra powers) -------------------- */
function UserBooking({ user, club }){
  const [sports, setSports] = useState([]);
  const [sport, setSport] = useState('');
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10));
  const [grid, setGrid] = useState(null);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(null); // { courtIndex, time }
  const [bookFor, setBookFor] = useState('');   // manager-only: username to assign booking


  useEffect(()=>{
    (async ()=>{
      setSportsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const r = await fetch(`${API}/clubs/${club.id}/sports`, { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const all = await r.json().catch(()=>null);
        if (!r.ok || !Array.isArray(all)) {
          setSports([]);
        } else {
          setSports(all);
          if (all.length) setSport(all[0].sport);
        }
      } catch (e) {
        console.error('Error loading sports:', e);
        setSports([]);
      } finally {
        setSportsLoading(false);
      }
    })();
  }, [club.id]);

  useEffect(()=>{
    if (!sport || !date) return;
    (async ()=>{
      setGridLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const r = await fetch(`${API}/availability?clubId=${club.id}&sport=${sport}&date=${date}&userId=${user.id}`, { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const d = await r.json();
        if (r.ok) {
          // If server provided serverNowUtc and slotStartUtc values, use them; otherwise fall back to server-side isPast.
          if (d && d.serverNowUtc && Array.isArray(d.slots)) {
            const serverNowMs = Date.parse(d.serverNowUtc);
            const slots = d.slots.map(row => ({
              ...row,
              // row.slotStartUtc exists per-slot (UTC string)
              isPast: row.slotStartUtc ? (Date.parse(row.slotStartUtc) < serverNowMs) : !!row.isPast,
            }));
            setGrid({ ...d, slots });
          } else {
            setGrid(d);
          }
        } else { 
          setGrid(null); 
          alert(d.error || 'error'); 
        }
      } catch (e) {
        console.error('Error loading availability:', e);
        setGrid(null);
      } finally {
        setGridLoading(false);
      }
    })();
  }, [sport, date, club.id, user.id]);

  // Recompute 'isPast' locally every 30s and optionally refetch availability every 60s
  useEffect(() => {
    if (!grid || !grid.slots) return undefined;
    let tick = null;
    // recompute every 30s
    tick = setInterval(() => {
      setGrid(prev => {
        if (!prev || !prev.slots) return prev;
        const now = Date.now();
        // If server provided serverNowUtc, compute offset between server and client
        const serverNowMs = prev.serverNowUtc ? Date.parse(prev.serverNowUtc) : null;
        const offset = serverNowMs ? (now - serverNowMs) : 0;
        const slots = prev.slots.map(row => {
          const slotMs = row.slotStartUtc ? Date.parse(row.slotStartUtc) : null;
          const computedIsPast = slotMs ? (slotMs < (now - offset)) : !!row.isPast;
          return { ...row, isPast: computedIsPast };
        });
        return { ...prev, slots };
      });
    }, 30000);

    // optional refetch every 60s to pick up new bookings
    const refetchId = setInterval(() => {
      (async () => {
        try {
          const r = await fetch(`${API}/availability?clubId=${club.id}&sport=${sport}&date=${date}&userId=${user.id}`, { credentials: 'include' });
          const d = await r.json().catch(()=>null);
          if (r.ok && d) {
            if (d && d.serverNowUtc && Array.isArray(d.slots)) {
              const serverNowMs = Date.parse(d.serverNowUtc);
              const slots = d.slots.map(row => ({
                ...row,
                isPast: row.slotStartUtc ? (Date.parse(row.slotStartUtc) < serverNowMs) : !!row.isPast,
              }));
              setGrid({ ...d, slots });
            } else {
              setGrid(d);
            }
          }
        } catch (e) {
          // ignore periodic fetch failures
        }
      })();
    }, 60000);

    return () => { clearInterval(tick); clearInterval(refetchId); };
  }, [grid?.slots?.length, club.id, sport, date, user.id]);

  // Managers can book multiple & can cancel anyone's booking
  const isManager = user.role === 'manager';
  const isOwnClubManager = isManager && Number(club?.manager_id) === Number(user.id);
  // Only consider owned slots that are NOT in the past. If the user's booking
  // has already ended (row.isPast === true) it should not block new bookings.
  const hasOwnBooking = isManager ? false : grid?.slots?.some(row => !row.isPast && row.courts.some(c => c.owned));

  const openConfirm = (courtIndex, time) => {
  if (hasOwnBooking && !isManager) return;
  setPending({ courtIndex, time });
  setBookFor(''); // reset on open
  setConfirmOpen(true);
};

  const closeConfirm = () => { setConfirmOpen(false); setPending(null); };

  const refresh = async () => {
    try {
    const r = await fetch(`${API}/availability?clubId=${club.id}&sport=${sport}&date=${date}&userId=${user.id}`, { credentials: 'include' });
      const d = await r.json().catch(()=>null);
      if (r.ok) setGrid(d);
      else {
        // keep previous grid visible (do not overwrite with error payload) and notify user
        alert((d && d.error) || 'Failed to refresh availability');
      }
    } catch (err) {
      console.error('refresh error', err);
      alert('Failed to refresh availability');
    }
  };

  const confirmBook = async () => {
  if (!pending) return;
  const { courtIndex, time } = pending;

  // Managers must enter a username to assign the booking
  if (isManager && !bookFor.trim()) {
    alert('Please enter the username to assign this booking to.');
    return;
  }

    const res = await fetch(`${API}/book`, {
      method:'POST', headers:{'Content-Type':'application/json'}, credentials: 'include',
    body: JSON.stringify({
      clubId: club.id,
      sport,
      courtIndex,
      date,
      time,
      userId: user.id,
      ...(isManager ? { asUsername: bookFor.trim() } : {})
    })
  });
  const data = await res.json().catch(()=>null);
  if (!res.ok) {
    alert((data && data.error) || 'Booking failed');
    closeConfirm();
    // Do not call refresh() here — refresh may try to set the grid to an error payload and crash the UI.
    return;
  }
  closeConfirm();
  await refresh();
};


  const cancelBooking = async (bookingId) => {
    const yes = confirm('Cancel this reservation?');
    if (!yes) return;
    const res = await fetch(`${API}/cancel`, {
      method:'POST', headers:{'Content-Type':'application/json'}, credentials: 'include',
      body: JSON.stringify({ bookingId, userId: user.id })
    });
    const data = await res.json().catch(()=>null);
    if (!res.ok) alert((data && data.error) || 'Cancel failed');
    await refresh();
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div>
            <div className="text-sm text-gray-600">Sport</div>
            {sportsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={sport} onChange={e=>setSport(e.target.value)}>
                {sports.map(s => <option key={s.id} value={s.sport}>{s.sport}</option>)}
              </Select>
            )}
          </div>
          <div>
            <div className="text-sm text-gray-600">Date</div>
            <TextInput type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-3 md:justify-start">
            <div className="flex items-center gap-1">
              <div className="w-[6px] h-[24px] rounded bg-green-500" style={{backgroundColor: '#10b981', minWidth: '6px', minHeight: '24px'}}></div> 
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[6px] h-[24px] rounded bg-orange-500" style={{backgroundColor: '#f97316', minWidth: '6px', minHeight: '24px'}}></div> 
              <span className="text-sm">Yours</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[6px] h-[24px] rounded bg-red-500" style={{backgroundColor: '#ef4444', minWidth: '6px', minHeight: '24px'}}></div> 
              <span className="text-sm">Unavailable</span>
            </div>
          </div>
        </div>
      </Card>

      {gridLoading ? (
        <Card>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              {Array.from({length: 4}).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-12 w-16" />
                {Array.from({length: 4}).map((_, j) => (
                  <Skeleton key={j} className="h-12 w-20" />
                ))}
              </div>
            ))}
          </div>
        </Card>
      ) : grid ? (
        <Card>
          <div className="courts-scroll-container">
            <div className="table-responsive">
              <table className="courts-table w-full border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left p-2 min-w-16">Time</th>
                  {Array.from({length: grid.cfg.courts}).map((_, i) => (
                    <th key={i} className="text-left p-2 min-w-20">Court {i+1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.slots.map(row => (
                  <tr key={row.time}>
                    <td data-label="Time" className="p-2 text-sm text-gray-700">{row.time}</td>
                    {row.courts.map((cell, i) => (
                      <td data-label={`Court ${i+1}`} key={cell.courtIndex} className="p-1">
                        {cell.owned ? (
                          <button
                            onClick={() => cancelBooking(cell.bookingId)}
                            className="w-full rounded bg-orange-500 hover:opacity-90 relative
                                      min-h-12 sm:h-10 active:scale-[.98] transition"
                            title="Click to cancel your reservation"
                          >
                            {/* Always show the booking name for owned slots: prefer bookedBy when present, otherwise show 'You' */}
                            <span className="absolute inset-0 grid place-items-center text-[11px] text-white font-medium select-none">
                              {cell.bookedBy ? cell.bookedBy : 'You'}
                            </span>
                            <span className="sr-only">Cancel your reservation</span>
                          </button>
                        ) : cell.booked ? (
                          isManager ? (
                            <button
                              onClick={() => cancelBooking(cell.bookingId)}
                              className="w-full rounded bg-red-500 hover:opacity-90 relative
                                        min-h-12 sm:h-10 active:scale-[.98] transition"
                              title="Manager: click to cancel this booking"
                            >
                              {/* Show the name of the user who booked this slot (if available) */}
                              {cell.bookedBy && (
                                <span className="absolute inset-0 grid place-items-center text-[11px] text-white font-medium select-none">
                                  {cell.bookedBy}
                                </span>
                              )}
                              <span className="sr-only">Cancel booking</span>
                            </button>
                          ) : (
                            <div className="rounded bg-red-500 min-h-12 sm:h-10 relative">
                              {/* For non-managers, show the booking name if available */}
                              {cell.bookedBy && (
                                <span className="absolute inset-0 grid place-items-center text-[11px] text-white font-medium select-none">
                                  {cell.bookedBy}
                                </span>
                              )}
                            </div>
                          )
                        ) : (
                          // slot is free
                          (() => {
                            const past = !!row.isPast;
                            const disabled = (hasOwnBooking && !isManager) || (past && !isManager);
                            const extraCls = past ? 'opacity-50 cursor-not-allowed' : '';
                            return (
                              <button
                                onClick={() => openConfirm(cell.courtIndex, row.time)}
                                className={`w-full rounded bg-green-500 hover:opacity-90 relative
                                            min-h-12 sm:h-10 active:scale-[.98] transition ${extraCls}`}
                                disabled={disabled}
                                aria-pressed="false"
                              >
                                <span className="sr-only">Book this slot</span>
                              </button>
                            );
                          })()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </Card>
      ) : null}

      {!gridLoading && !grid && sport && date && (
        <Card>
          <div className="text-sm text-gray-600">Select a sport and date to see slots.</div>
        </Card>
      )}

      {confirmOpen && pending && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50">
          <div className="bg-white rounded-xl shadow p-5 w-[320px]">
            <div className="text-lg font-medium mb-3">Confirm reservation</div>
            <div className="text-sm text-gray-700 mb-4">
              Do you want to reserve at <b>{pending.time}</b> on <b>{date}</b>?
            </div>

            {/* Manager-only: assign to a username */}
            {isManager && (
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-1">Username to assign booking</div>
                <input
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="Exact username (e.g., alice)"
                  value={bookFor}
                  onChange={e=>setBookFor(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={closeConfirm} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">Cancel</button>
              <button onClick={confirmBook} className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- Clubs Page -------------------- */
function ClubsPage({ user, club, onSetActive, onJoin, onCreate, onOpenManageModal }) {
  const [clubs, setClubs] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newTimezone, setNewTimezone] = useState(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
  });
  // Club invitations and requests state
  const [invitations, setInvitations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [busy, setBusy] = useState(false);
  // curated list for club creation/editing (UTC first, then host tz if different, then common US timezones)
  const HOST_TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; } })();
  const US_TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'America/Adak'
  ];
  const CLUB_TIMEZONE_OPTIONS = (() => {
    const opts = ['UTC'];
    if (HOST_TZ && HOST_TZ !== 'UTC') opts.push(HOST_TZ);
    for (const tz of US_TIMEZONES) if (!opts.includes(tz)) opts.push(tz);
    return opts;
  })();
  const [error, setError] = useState('');
  const isManager = user.role === 'manager';

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

  // Load user invitations and requests
  const loadInvitationsAndRequests = async () => {
    setLoadingInvitations(true);
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
      console.error('Error loading invitations and requests:', e);
    } finally {
      setLoadingInvitations(false);
    }
  };

  // Handle invitation response
  const handleInvitation = async (inviteId, action) => {
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
        // Refresh clubs and invitations
        await load();
        await loadInvitationsAndRequests();
        alert('Invitation accepted! You have joined the club.');
      } else {
        // Just refresh the invitations list
        await loadInvitationsAndRequests();
      }
    } finally { setBusy(false); }
  };

  const load = async () => {
    setError('');
    setLoadingClubs(true);
    try {
    const r = await fetch(`${API}/users/${user.id}/clubs`, { credentials: 'include' });
      if (!r.ok) {
        const d = await r.json().catch(()=>null);
        throw new Error((d && d.error) || `Failed to load clubs (${r.status})`);
      }
      const data = await r.json();
      setClubs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(String(e.message || e));
    } finally {
      setLoadingClubs(false);
    }
  };

  useEffect(() => { 
    load(); 
    loadInvitationsAndRequests();
  }, []);

  const join = async () => {
    try {
      const res = await fetch(`${API}/clubs/join`, {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials: 'include',
        body: JSON.stringify({ code: joinCode.trim(), userId: user.id })
      });
      const data = await res.json().catch(()=>null);
      if (!res.ok) {
        if (data.error === 'request already pending') {
          alert('Your request to join this club is already pending approval.');
          await loadInvitationsAndRequests(); // Refresh to show the new request
        } else {
          alert(data.error || 'Join failed');
        }
        return;
      }
      
      setJoinCode('');
      await load();
      await loadInvitationsAndRequests(); // Refresh invitations and requests
      
      if (data.status === 'approved') {
        onSetActive(data.club);
        // Update parent's userClubs state
        if (onJoin) onJoin(data.club);
      } else if (data.status === 'pending') {
        alert('Your request has been sent to the club manager for approval.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const create = async () => {
    try {
      const res = await fetch(`${API}/clubs`, {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials: 'include',
        body: JSON.stringify({ name: newName.trim(), managerId: user.id, timezone: newTimezone })
      });
      const data = await res.json().catch(()=>null);
      if (!res.ok) throw new Error((data && data.error) || 'Create failed');
      setNewName('');
      await load();
      onSetActive(data);
      // Update parent's userClubs state
      if (onCreate) onCreate(data);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Clubs</h2>

      {error && <Card><div className="text-red-600 text-sm">{error}</div></Card>}

      <Card>
        <h3 className="text-lg font-medium mb-2">Your clubs</h3>
        <div className="grid gap-2">
          {loadingClubs ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : clubs.map(c => (
            <div key={c.id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between mb-2 sm:mb-0 sm:items-center">
                <div className="text-sm">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-gray-600 text-xs"><CodeWithCopy code={c.code} /></div>
                </div>
                <div className="ml-2 sm:hidden">
                  <SetActiveButton 
                    isActive={club && club.id === c.id}
                    onClick={() => onSetActive(c)}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                {/* Timezone selector only visible to the club's manager (creator) */}
                {Number(c.manager_id) === Number(user.id) && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:w-64">
                      <select
                        className="border rounded-lg px-3 py-2 w-full text-sm"
                        value={c.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                        onChange={async (e) => {
                          const tz = e.target.value;
                          try {
                            const r = await fetch(`${API}/clubs/${c.id}/timezone`, {
                              method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
                              body: JSON.stringify({ managerId: user.id, timezone: tz })
                            });
                            const d = await r.json().catch(()=>null);
                            if (!r.ok) return alert(d?.error || 'Failed to update timezone');
                            // Refresh clubs list to pick up updated timezone
                            await (async () => { const rr = await fetch(`${API}/users/${user.id}/clubs`, { credentials: 'include' }); const dat = await rr.json().catch(()=>null); setClubs(Array.isArray(dat)?dat:[]); })();
                          } catch (err) {
                            console.error('update tz error', err);
                            alert('Failed to update timezone');
                          }
                        }}
                    >
                      {CLUB_TIMEZONE_OPTIONS.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                    </div>
                    <button
                      onClick={() => {
                        onOpenManageModal(c);
                      }}
                      className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 whitespace-nowrap"
                      title="Manage club requests and members"
                    >
                      Manage
                    </button>
                  </div>
                )}

                {/* People button for non-managers */}
                {Number(c.manager_id) !== Number(user.id) && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        onOpenManageModal(c);
                      }}
                      className="bg-gray-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-600 whitespace-nowrap"
                      title="View club members"
                    >
                      People
                    </button>
                  </div>
                )}

                <div className="hidden sm:block">
                  <SetActiveButton 
                    isActive={club && club.id === c.id}
                    onClick={() => onSetActive(c)}
                  />
                </div>
              </div>
            </div>
          ))}
          {clubs.length === 0 && !loadingClubs && !error && (
            <div className="text-gray-500 text-sm">You’re not in any clubs yet.</div>
          )}
        </div>
      </Card>

      {/* Club Invitations Section */}
      <Card>
        <h3 className="text-lg font-medium mb-3">Club Invitations</h3>
        {loadingInvitations ? (
          <div className="space-y-3">
            <SkeletonCard />
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-gray-500 text-sm">No pending invitations</div>
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
                      className="px-3 py-1 text-sm rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-60"
                      onClick={() => handleInvitation(invitation.id, 'accept')}
                      disabled={busy}
                    >
                      Accept
                    </button>
                    <button
                      className="px-3 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
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
      </Card>

      {/* Pending Join Requests Section */}
      <Card>
        <h3 className="text-lg font-medium mb-3">Pending Join Requests</h3>
        {loadingInvitations ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="text-gray-500 text-sm">No pending requests</div>
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
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-medium mb-3">Join another club</h3>
          <div className="flex gap-2">
            <TextInput placeholder="Enter club code" value={joinCode} onChange={e=>setJoinCode(e.target.value)} />
            <Button onClick={join} disabled={!joinCode.trim()}>Join</Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium mb-3">{isManager ? 'Create a new club' : 'Request a new club (manager only)'}</h3>
            <div className="flex gap-2">
            <div className="flex-1">
              <TextInput placeholder="Club name" value={newName} onChange={e=>setNewName(e.target.value)} disabled={!isManager}/>
            </div>
            <div className="w-56">
              <select className="border rounded-lg px-3 py-2 w-full" value={newTimezone} onChange={e=>setNewTimezone(e.target.value)}>
                {CLUB_TIMEZONE_OPTIONS.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <Button onClick={create} disabled={!newName.trim() || !isManager}>Create</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TournamentsView({ API, club, user, isManager }) {
  const [list, setList] = useState([]);
  const [joined, setJoined] = useState({}); // { [tournamentId]: boolean }
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'completed' | 'all'
  const [loading, setLoading] = useState(false);

  // creation form
  const [name, setName] = useState('');
  const [sport, setSport] = useState('tennis');
  const [drawSize, setDrawSize] = useState(16);
  const [seedCount, setSeedCount] = useState(4);
  const [pointsByRound, setPointsByRound] = useState({
    R128: 0, R64: 5, R32: 10, R16: 20, QF: 40, SF: 70, F: 120, C: 200
  });

  // selected tournament
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);

  const roundLabelsFor = (sz) => {
    const map = [
      { label: 'R128', size: 128 }, { label: 'R64', size: 64 }, { label: 'R32', size: 32 },
      { label: 'R16', size: 16 }, { label: 'QF', size: 8 }, { label: 'SF', size: 4 },
      { label: 'F', size: 2 }, { label: 'C', size: 1 }
    ];
    return map.filter(x => x.size <= sz).map(x => x.label);
  };

  const loadList = async () => {
    if (!club) return;
    setLoading(true);
    const q = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
    const r = await fetch(`${API}/clubs/${club.id}/tournaments${q}`);
    const data = await r.json();
    const arr = Array.isArray(data) ? data : [];
    setList(arr);

    if (user && !isManager) {
      const entries = await Promise.all(arr.map(async (t) => {
        const jr = await fetch(`${API}/tournaments/${t.id}/joined?userId=${user.id}`);
        const jd = await jr.json().catch(()=>({joined:false}));
        return [t.id, !!jd.joined];
      }));
      setJoined(Object.fromEntries(entries));
    } else {
      setJoined({});
    }

    setLoading(false);
  };

  useEffect(() => { loadList(); }, [club?.id, statusFilter]);

  const createTournament = async () => {
    if (!isManager) return;
    if (!name.trim()) return alert('Name required');
    const needed = roundLabelsFor(Number(drawSize));
    const pts = {};
    needed.forEach(lbl => { pts[lbl] = Number(pointsByRound[lbl] || 0); });

    const r = await fetch(`${API}/clubs/${club.id}/tournaments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(), sport, drawSize: Number(drawSize),
        seedCount: Number(seedCount), pointsByRound: pts, managerId: user.id
      })
    });
    const data = await r.json();
    if (!r.ok) return alert(data.error || 'Create failed');
    setName('');
    await loadList();
  };

  const openDetail = async (id) => {
    setSelectedId(id);
    const r = await fetch(`${API}/tournaments/${id}`);
    if (!r.ok) {
      const err = await r.json().catch(()=>({ error: 'Failed to load tournament' }));
      alert(err.error || 'Failed to load tournament');
      return;
    }
    const data = await r.json().catch(() => null);
    if (!data || !data.tournament) {
      alert('Invalid tournament data from server');
      return;
    }
    setDetail(data);
  };

  // Sign in / Withdraw (non-managers)
  const signIn = async (tid, tname) => {
    if (!user) return alert('Please sign in first');
    const ok = window.confirm(`Do you want to sign in for "${tname}"?`);
    if (!ok) return;
    const r = await makeAuthenticatedRequest(`${API}/tournaments/${tid}/register`, {
      method: 'POST'
    });
    const data = await r.json();
    if (!r.ok) return alert(data.error || 'Sign in failed');
    await loadList();
    if (selectedId === tid) await openDetail(tid);
  };

  const withdraw = async (tid, tname) => {
    const ok = window.confirm(`Withdraw from "${tname}"?`);
    if (!ok) return;
    const r = await makeAuthenticatedRequest(`${API}/tournaments/${tid}/register`, {
      method: 'DELETE'
    });
    const data = await r.json().catch(()=>null);
    if (!r.ok) return alert((data && data.error) || 'Withdraw failed');
    await loadList();
    if (selectedId === tid) await openDetail(tid);
  };

  // Manager: remove an entrant from the list (pre-draw)
  const removeEntrant = async (playerId) => {
    if (!selectedId) return;
    const ok = window.confirm('Remove this player from the tournament?');
    if (!ok) return;
    const r = await fetch(`${API}/tournaments/${selectedId}/players/${playerId}?managerId=${user.id}`, { method: 'DELETE' });
    const data = await r.json().catch(()=>null);
    if (!r.ok) return alert((data && data.error) || 'Remove failed');
    await openDetail(selectedId);
  };

  // Manager: delete ONE tournament (confirm yes/cancel)
  const deleteTournament = async (tid, tname) => {
    const ok = window.confirm(`Are you sure you want to delete "${tname}"?`);
    if (!ok) return;
    const r = await fetch(`${API}/tournaments/${tid}?managerId=${user.id}`, { method: 'DELETE' });
    const data = await r.json().catch(()=>null);
    if (!r.ok) return alert((data && data.error) || 'Delete failed');
    if (selectedId === tid) setDetail(null);
    await loadList();
  };

  // Manager: delete ALL tournaments in current section (type "delete")
  const deleteAllInSection = async () => {
    if (!list.length) return alert('There are no tournaments to delete in this section.');
    const word = window.prompt(`Are you sure you want to delete all tournaments in "${statusFilter}"? Type "delete" to confirm.`);
    if (word !== 'delete') return;
    const r = await fetch(`${API}/clubs/${club.id}/tournaments?status=${statusFilter}&managerId=${user.id}`, { method: 'DELETE' });
    const data = await r.json().catch(()=>null);
    if (!r.ok) return alert((data && data.error) || 'Bulk delete failed');
    setDetail(null);
    await loadList();
  };

  // Manager legacy add-players
  const [playerIdsText, setPlayerIdsText] = useState('');
  const addPlayers = async () => {
    if (!selectedId) return;
    const names = playerIdsText.split(',').map(s => s.trim()).filter(Boolean);
    if (!names.length) return alert('Enter usernames separated by commas');
    try {
      // Best-effort: try to resolve the provided names to userIds via a simple lookup
      // so we can send userIds when possible. This avoids ambiguity when display names collide.
      const lookupRes = await Promise.all(names.map(n => fetch(`${API}/users/lookup?name=${encodeURIComponent(n)}`)));
      const lookupJson = await Promise.all(lookupRes.map(r => r.json().catch(()=>null)));
      const userIds = [];
      const unresolved = [];
      for (let i = 0; i < lookupJson.length; i++) {
        const j = lookupJson[i];
        if (j && j.id) userIds.push(j.id);
        else unresolved.push(names[i]);
      }

      const payload = {};
      if (userIds.length) payload.userIds = userIds;
      if (unresolved.length) payload.usernames = unresolved;
      payload.managerId = user.id;

      const r = await fetch(`${API}/tournaments/${selectedId}/players`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(()=>null);
      if (!r.ok) {
        // Show ambiguous errors returned by server in a readable way
        if (data && data.error === 'Ambiguous usernames' && Array.isArray(data.ambiguous)) {
          const msgs = data.ambiguous.map(a => `${a.name}: ${a.candidates.join(' / ')}`);
          return alert('Ambiguous names:\n' + msgs.join('\n'));
        }
        return alert((data && data.error) || 'Add players failed');
      }

      setPlayerIdsText('');
      await openDetail(selectedId);
    } catch (e) {
      console.error('addPlayers error', e);
      alert('Add players failed: ' + (e && e.message ? e.message : String(e)));
    }
  };

  const generateBracket = async () => {
    if (!selectedId) return;
    const r = await fetch(`${API}/tournaments/${selectedId}/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drawSize: Number(drawSize), seedCount: Number(seedCount), managerId: user.id })
    });
    const data = await r.json();
    if (!r.ok) return alert(data.error || 'Generate failed');
    await openDetail(selectedId);
  };

  // ======== Seed-aware name rendering ========
  let playersById = new Map();
  if (detail?.players) {
    playersById = new Map(
      (detail?.players || []).map(p => [
        p.id,
        { name: p.display_name, seed: p.seed == null ? null : Number(p.seed) }
      ])
    );
  }

  function NameWithSeed({ pid, nullLabel }) {
    if (pid == null) {
      return <span className="truncate italic text-gray-400">{nullLabel || 'TBD'}</span>;
    }
    const info = playersById.get(pid);
    if (!info) return <span className="truncate">TBD</span>;

    const hasSeed = info.seed !== null && info.seed !== undefined;
    return (
      <span className="inline-flex items-baseline gap-1 truncate">
        {hasSeed ? (
          <span className="text-[10px] leading-none opacity-70 w-3 text-right">
            {String(info.seed)}
          </span>
        ) : (
          <span className="w-3" />
        )}
        <span className="truncate">{info.name}</span>
      </span>
    );
  }





  const reportResult = async (matchId, p1_score, p2_score) => {
    const s1 = Number(p1_score), s2 = Number(p2_score);
    if (!Number.isFinite(s1) || !Number.isFinite(s2)) return alert('Enter both scores');
    if (s1 === s2) return alert('Scores must not tie');
    const r = await fetch(`${API}/matches/${matchId}/result`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerId: user.id, p1_score: s1, p2_score: s2 })
    });
    const data = await r.json().catch(()=>null);
    if (!r.ok) return alert((data && data.error) || 'Save failed');
    await openDetail(selectedId);

    // Notify other parts of the app (e.g., Rankings) that standings may have changed
    try {
      const ev = new CustomEvent('standingsUpdated', { detail: { clubId: club?.id } });
      window.dispatchEvent(ev);
    } catch (err) {
      // ignore in old browsers
    }
  };

  const renderBracket = () => {
    if (!detail || !detail.matches?.length) {
      return <div className="text-sm text-gray-500">No matches yet.</div>;
    }
    const rounds = [...new Set(detail.matches.map(m => m.round))].sort((a, b) => b - a);
    const firstRound = Math.max(...rounds);
    const final = detail.matches.find(m => m.round === 1);
    const championId = final
      ? (final.winner_id ?? (final.status === 'completed'
            ? (Number(final.p1_score) > Number(final.p2_score) ? final.p1_id : final.p2_id)
            : null))
      : null;
    const championInfo = championId ? playersById.get(championId) : null;


    return (
      <div className="w-full overflow-x-auto">
        <div className="flex gap-6 items-start">
          {rounds.map(rnd => {
            const ms = detail.matches.filter(m => m.round === rnd).sort((a,b)=>a.slot - b.slot);
            const title = rnd === 1 ? 'Final' : rnd === 2 ? 'Semifinal' : rnd === 3 ? 'Quarterfinal' : `Round ${rnd}`;
            return (
              <div key={rnd} className="min-w-[240px]">
                <div className="text-sm font-semibold mb-2">{title}</div>
                <div className="flex flex-col gap-3">
                  {ms.map(m => {
                    const completed = m.status === 'completed';
                    // determine if this is a BYE: in first round, a null pX_id and the opponent exists
                    const isByeP1 = (m.p1_id == null) && (m.p2_id != null) && (m.round === firstRound);
                    const isByeP2 = (m.p2_id == null) && (m.p1_id != null) && (m.round === firstRound);

                    return (
                      <div key={m.id} className="border rounded-lg p-3 bg-white shadow-sm">
                        <div className="flex justify-between">
                          <div className={`truncate ${m.winner_id === m.p1_id ? 'font-semibold' : ''}`}>
                            <NameWithSeed pid={m.p1_id} nullLabel={isByeP1 ? 'BYE' : 'TBD'} />
                          </div>
                          <div className="text-xs text-gray-500">{completed ? m.p1_score : ''}</div>
                        </div>
                        <div className="flex justify-between">
                          <div className={`truncate ${m.winner_id === m.p2_id ? 'font-semibold' : ''}`}>
                            <NameWithSeed pid={m.p2_id} nullLabel={isByeP2 ? 'BYE' : 'TBD'} />
                          </div>
                          <div className="text-xs text-gray-500">{completed ? m.p2_score : ''}</div>
                        </div>

                        {isManager && m.status !== 'completed' && m.p1_id && m.p2_id && (
                          <div className="mt-2 flex items-center gap-2">
                            <input type="number" placeholder="P1" className="border rounded px-2 py-1 w-16"
                                   onChange={(e) => (m._p1 = Number(e.target.value))} />
                            <input type="number" placeholder="P2" className="border rounded px-2 py-1 w-16"
                                   onChange={(e) => (m._p2 = Number(e.target.value))} />
                            <button className="px-3 py-1 rounded bg-black text-white"
                                    onClick={() => reportResult(m.id, m._p1 ?? 0, m._p2 ?? 0)}>
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {championInfo && (
            <div className="ml-auto sticky top-3">
              <div className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 bg-yellow-50 border-yellow-200 text-yellow-900 shadow-sm">
                <span>🏆 Champion:</span>
                <span className="inline-flex items-baseline gap-1 font-semibold">
                  {championInfo.seed != null ? (
                    <span className="text-[10px] leading-none opacity-70 w-3 text-right">
                      {String(championInfo.seed)}
                    </span>
                  ) : <span className="w-3" />}
                  <span>{championInfo.name}</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      {/* Filters + actions */}
      <div className="flex items-center gap-3">
        <select className="border rounded px-2 py-1" value={statusFilter} onChange={(e)=> setStatusFilter(e.target.value)}>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>
        <button onClick={loadList} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 shadow-sm hover:shadow-md transition-all duration-200 font-medium text-gray-700">Refresh</button>

        {isManager && (
          <button
            className="delete-all-button ml-auto"
            onClick={deleteAllInSection}
            title={`Delete all tournaments in "${statusFilter}"`}
          >
            Delete all in {statusFilter}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(t => (
            <div key={t.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="text-sm font-semibold mb-3">{t.name} · {t.sport} {t.end_date ? '· Completed' : '· Active'}</div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
                <button className="slice" onClick={()=> openDetail(t.id)}>
                  <span className="text">View</span>
                </button>

                {!isManager && !t.end_date && (
                  joined[t.id] ? (
                    <button className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200 font-medium min-h-[44px]"
                            onClick={()=> withdraw(t.id, t.name)}>Withdraw</button>
                  ) : (
                    <button className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black shadow-lg hover:shadow-xl transition-all duration-200 font-medium min-h-[44px]"
                            onClick={()=> signIn(t.id, t.name)}>Sign in</button>
                  )
                )}

                {isManager && (
                  <button
                    className="delete-button sm:ml-auto"
                    onClick={()=> deleteTournament(t.id, t.name)}
                    title="Delete this tournament"
                  >
                    <svg className="svgIcon" viewBox="0 0 448 512">
                      <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
          {list.length === 0 && <div className="text-sm text-gray-500">No tournaments yet.</div>}
        </div>
      )}

      {/* Manager: create tournament */}
      {isManager && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="text-base font-semibold mb-3">Create Tournament</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Sport (e.g., tennis)" value={sport} onChange={e=>setSport(e.target.value)} />
            <select className="border rounded px-3 py-2" value={drawSize} onChange={e=>setDrawSize(Number(e.target.value))}>
              {[4,8,16,32,64,128].map(n=> <option key={n} value={n}>{n} draw</option>)}
            </select>
            <input type="number" min={0} max={Math.min(32, Number(drawSize))}
                   className="border rounded px-3 py-2" value={seedCount}
                   onChange={e=>setSeedCount(Number(e.target.value))} />
          </div>

          {/* Points by round */}
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-7 gap-2">
            {roundLabelsFor(Number(drawSize)).map(lbl => (
              <div key={lbl} className="flex items-center gap-2">
                <span className="text-xs w-10 text-gray-600">{lbl}</span>
                <input type="number" className="border rounded px-2 py-1 w-20"
                       value={pointsByRound[lbl] ?? 0}
                       onChange={e => setPointsByRound(prev => ({ ...prev, [lbl]: Number(e.target.value) }))} />
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button className="px-4 py-2 rounded bg-black text-white" onClick={createTournament}>Create</button>
          </div>
        </div>
      )}

      {/* Detail / Bracket */}
      {detail && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">{detail?.tournament?.name ?? ''} · {detail?.tournament?.sport ?? ''}</div>
            <button className="text-sm text-gray-500 hover:underline" onClick={()=> setDetail(null)}>Close</button>
          </div>

          {/* Manager pre-draw controls */}
          {isManager && !detail?.tournament?.end_date && detail?.matches?.length === 0 && (
            <div className="mt-3 grid md:grid-cols-3 gap-3">
              {/* Add players (usernames) */}
              <div className="border rounded p-3">
                <div className="text-sm font-medium mb-2">Add Players (usernames, comma-separated)</div>
                <input className="border rounded px-2 py-1 w-full"
                       placeholder="e.g., alice, bob, charlie"
                       value={playerIdsText}
                       onChange={e=>setPlayerIdsText(e.target.value)} />
                <button className="mt-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={addPlayers}>
                  Add
                </button>
              </div>

              {/* Registered players */}
              <div className="border rounded p-3">
                <div className="text-sm font-medium mb-2">Registered Players</div>
                <ul className="space-y-1 max-h-48 overflow-auto">
                  {detail?.players?.map(p => (
                    <li key={p.id} className="flex items-center justify-between">
                      <span>{p.display_name}</span>
                      <button className="text-xs px-2 py-0.5 rounded bg-red-100 hover:bg-red-200"
                              onClick={()=> removeEntrant(p.id)}>Remove</button>
                    </li>
                  ))}
                  {detail.players.length === 0 && <li className="text-xs text-gray-500">No one has signed in yet.</li>}
                </ul>
              </div>

              {/* Generate bracket */}
              <div className="border rounded p-3">
                <div className="text-sm font-medium mb-2">Generate Bracket</div>
                <div className="flex gap-2 items-center">
                  <select className="border rounded px-2 py-1" value={drawSize} onChange={e=>setDrawSize(Number(e.target.value))}>
                    {[4,8,16,32,64,128].map(n=> <option key={n} value={n}>{n}</option>)}
                  </select>
                  <input type="number" min={0} max={Math.min(32, Number(drawSize))}
                         className="border rounded px-2 py-1 w-20"
                         value={seedCount} onChange={e=>setSeedCount(Number(e.target.value))} />
                  <button className="px-3 py-1 rounded bg-black text-white" onClick={generateBracket}>Generate</button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">{renderBracket()}</div>
        </div>
      )}
    </div>
  );
}



function RankingsView({ API, club, user, isManager }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [confirm1, setConfirm1] = React.useState(false);
  const [typed, setTyped] = React.useState('');

  const load = async () => {
    if (!club) return;
    setLoading(true);
    try {
      console.debug('RankingsView: fetching standings for club', club.id, 'from', API);
      const { res, data } = await j(`/clubs/${club.id}/standings`);
      if (!res.ok) {
        console.warn('RankingsView: standings fetch failed', res.status, data);
        setRows([]);
      } else {
        setRows(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('RankingsView: error loading standings', err);
      setRows([]);
    }
    setLoading(false);
  };

  React.useEffect(() => { load(); }, [club?.id]);

  // Listen for global standingsUpdated events so the Rankings view can refresh
  React.useEffect(() => {
    const handler = (e) => {
      try {
        if (!e?.detail || !e.detail.clubId) return load();
        if (e.detail.clubId === club?.id) load();
      } catch { /* ignore */ }
    };
    window.addEventListener('standingsUpdated', handler);
    return () => window.removeEventListener('standingsUpdated', handler);
  }, [club?.id]);

  const doReset = async () => {
    if (!club) return;
    const r = await fetch(`${API}/clubs/${club.id}/standings/reset`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerId: user.id, confirm: 'reset' })
    });
    const data = await r.json();
    if (!r.ok) return alert(data.error || 'Reset failed');
    setConfirm1(false);
    setTyped('');
    await load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">Rankings</div>

        <div className="flex items-center gap-2">
          {/* New Refresh button */}
          <button
            className="px-3 py-1 rounded bg-gray-200"
            onClick={load}
            title="Reload standings"
          >
            Refresh
          </button>

          {isManager && (
            <div>
              {!confirm1 ? (
                <button
                  className="px-3 py-1 rounded bg-red-600 text-white"
                  onClick={() => setConfirm1(true)}
                >
                  Reset rankings
                </button>
              ) : (
                <div className="p-3 border rounded bg-red-50">
                  <div className="text-sm font-medium">Are you sure you want to reset the rankings?</div>
                  <div className="text-xs text-red-700 mt-1">
                    This will set all the points back to 0 for everyone (and remove the list).
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      className="border rounded px-2 py-1"
                      placeholder='type "reset"'
                      value={typed}
                      onChange={(e)=> setTyped(e.target.value)}
                    />
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50"
                      disabled={typed !== 'reset'}
                      onClick={doReset}
                    >
                      Confirm
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-gray-200"
                      onClick={() => { setConfirm1(false); setTyped(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-500">No rankings yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="min-w-[520px] text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Player</th>
                <th className="py-2 pr-4">Tournaments</th>
                <th className="py-2 pr-4">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.player_id} className="border-b">
                  <td data-label="#" className="py-2 pr-4">{i + 1}</td>
                  <td data-label="Player" className="py-2 pr-4">{r.name}</td>
                  <td data-label="Tournaments" className="py-2 pr-4">{r.tournaments_played}</td>
                  <td data-label="Points" className="py-2 pr-4">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
