import React, { useEffect, useState } from 'react';
import Navbar from "./Navbar";
import './styles/theme.css';
import './styles/ui.css';
// removed a2hs (add-to-home-screen) to hide the Install App button in the navbar
import ClubGate from './ClubGate.jsx';

const safeParse = (s) => {
  try { return JSON.parse(s); } catch { return null; }
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
        className="px-2 py-0.5 text-xs border rounded hover:bg-gray-100"
        type="button"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  );
}
function Button({ children, ...props }) {
  return <button className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90 disabled:opacity-50" {...props}>{children}</button>;
}
function TextInput(props) {
  return <input {...props} className={"border rounded-lg px-3 py-2 w-full "+(props.className||'')} />;
}
function Select(props) {
  return <select {...props} className={"border rounded-lg px-3 py-2 w-full "+(props.className||'')} />;
}

export default function App(){
  const [user, setUser] = useState(() => safeParse(localStorage.getItem('user')));
  const [club, setClub] = useState(() => safeParse(localStorage.getItem('club')));
  const [view, setView] = useState('book'); // 'book' | 'clubs' | 'home' | 'tournaments' | 'rankings'

  function saveUser(u){ setUser(u); localStorage.setItem('user', JSON.stringify(u)); }
  function saveClub(c){ setClub(c); localStorage.setItem('club', JSON.stringify(c)); }

  // Single canonical handler for successful auth (used by Auth component)
  async function handleAuthed(u) {
    // Persist user and update state
    console.debug('handleAuthed: setting user', u && u.id);
    saveUser(u);

    // load club(s) with credentials so the server sees the authenticated cookie/session
    try {
      const r = await fetch(`${API}/users/${u.id}/clubs`, { credentials: 'include' });
      if (r.ok) {
        const clubs = await r.json().catch(()=>[]);
        if (clubs && clubs.length) {
          saveClub(clubs[0]);
          setView('book');
        }
      }
    } catch (e) {
      // ignore failures; UI will keep working with persisted user
    }
  }
  // Ensure we fetch the authoritative active club (this will backfill code if missing)
  // This effect must run (be declared) on every render to keep Hooks order stable.
  useEffect(() => {
    (async () => {
      if (!user || !user.id) return;
      try {
        const r = await fetch(`${API}/users/${user.id}/club`, { credentials: 'include' });
        if (!r.ok) return;
        const c = await r.json().catch(() => null);
        if (c) {
          saveClub(c);
        }
      } catch (e) {
        // ignore failures — app still works with cached club
      }
    })();
  }, [user?.id]);

  // Announcements (in-app messages) - moved above early returns so hooks stay stable
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
    // poll every 20s
    const id = setInterval(() => { loadAnnouncements(); }, 20000);
    return () => clearInterval(id);
  }, [user?.id]);

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
    } catch (e) {
      // ignore
    }
  };

  if (!user) {
    return <Auth onLogin={handleAuthed} onRegister={handleAuthed} />;
  }

  if (!club) return <ClubGate user={user} onJoin={(c)=>{saveClub(c); setView('book');}} onCreate={(c)=>{saveClub(c); setView('home');}} />;

  // Manager flag + page guard
  const isManager = user.role === 'manager';
  const effectivePage = isManager ? view : (view === 'home' ? 'book' : view);

  // (previously defined above) handleAuthed is used here

  


  if (user && !club) {
    return (
      <ClubGate
        user={user}
        onJoin={(c) => saveClub(c)}
        onCreate={(c) => saveClub(c)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onBook={() => setView('book')}
        onHome={() => setView('home')}
        onClubs={() => setView('clubs')}
        onTournaments={() => setView('tournaments')}
        onRankings={() => setView('rankings')}
        isManager={isManager}
        user={user}
        onLogout={async () => {
          try {
            // attempt to notify server (if route exists); don't block UI on failure
            await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(()=>null);
          } catch (e) {}
          // clear local state and storage so Auth screen renders immediately
          localStorage.removeItem('user');
          localStorage.removeItem('club');
          setUser(null);
          setClub(null);
          setView('book');
        }}
        onOpenAnnouncements={() => setShowAnnouncements(true)}
        unreadCount={unreadCount}
      />
      {showAnnouncements && (
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
      )}
      <div className="max-w-5xl mx-auto p-4 space-y-6 flex-1 main-content pt-6">
        {effectivePage === 'clubs' ? (
          <ClubsPage
            user={user}
            club={club}
            onSetActive={(c) => { saveClub(c); setView('book'); }}
          />
        ) : effectivePage === 'home' ? (
          <>
            <header className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Manager Home</h1>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span>{user.name} ({user.role})</span>
                <span className="mx-2">•</span>
                <span>{club.name} </span>
                <CodeWithCopy code={club.code} />
                <Button onClick={async ()=>{ await (async ()=>{ try{ await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(()=>null); }catch{} })(); localStorage.removeItem('user'); localStorage.removeItem('club'); setUser(null); setClub(null); setView('book'); }}>Logout</Button>
              </div>
            </header>
            <ManagerDashboard user={user} club={club} />
          </>
        ) : effectivePage === 'tournaments' ? (
          <>
            <header className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Tournaments</h1>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span>{user.name} ({user.role})</span>
                <span className="mx-2">•</span>
                <span>{club.name} </span>
                <CodeWithCopy code={club.code} />
                <Button onClick={async ()=>{ await (async ()=>{ try{ await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(()=>null); }catch{} })(); localStorage.removeItem('user'); localStorage.removeItem('club'); setUser(null); setClub(null); setView('book'); }}>Logout</Button>
              </div>
            </header>
            {/* ⬇️ Use the component we added earlier */}
            <TournamentsView API={API} club={club} user={user} isManager={isManager} />
          </>
        ) : effectivePage === 'rankings' ? (
          <>
            <header className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Rankings</h1>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span>{user.name} ({user.role})</span>
                <span className="mx-2">•</span>
                <span>{club.name} </span>
                <CodeWithCopy code={club.code} />
                <Button onClick={async ()=>{ await (async ()=>{ try{ await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(()=>null); }catch{} })(); localStorage.removeItem('user'); localStorage.removeItem('club'); setUser(null); setClub(null); setView('book'); }}>Logout</Button>
              </div>
            </header>
            <RankingsView API={API} club={club} user={user} isManager={isManager} />
          </>
        ) : (
          <>
            <header className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Book</h1>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span>{user.name} ({user.role})</span>
                <span className="mx-2">•</span>
                <span>{club.name} </span>
                <CodeWithCopy code={club.code} />
                <Button onClick={async ()=>{ await (async ()=>{ try{ await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(()=>null); }catch{} })(); localStorage.removeItem('user'); localStorage.removeItem('club'); setUser(null); setClub(null); setView('book'); }}>Logout</Button>
              </div>
            </header>
            <UserBooking user={user} club={club} />
          </>
        )}
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-[720px] max-w-[95%] bg-white rounded-xl shadow p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-medium">Announcements</h3>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded bg-gray-200" onClick={async ()=>{ await onRefresh(); }}>Refresh</button>
            <button className="px-3 py-1 rounded bg-gray-100" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            {isManager && (
              <div className="border rounded p-3 mb-3">
                <div className="text-sm font-medium mb-2">Create announcement</div>
                <input className="border rounded px-2 py-1 w-full mb-2" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
                <textarea className="border rounded px-2 py-1 w-full mb-2" rows={5} placeholder="Message" value={body} onChange={e=>setBody(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <button className="px-3 py-1 rounded bg-gray-200" onClick={()=>{ setTitle(''); setBody(''); }}>Reset</button>
                  <button className="px-3 py-1 rounded bg-black text-white" onClick={submit} disabled={busy}>Send</button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {announcements.length === 0 && <div className="text-sm text-gray-500">No announcements.</div>}
              {announcements.map(a => (
                <div key={a.id} className={`border rounded p-3 ${a.read ? '' : 'bg-yellow-50'}`}>
                  <div className="flex items-baseline justify-between">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-gray-500">{new Date(a.created_at || a.created || a.ts || Date.now()).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{a.body}</div>
                  <div className="mt-2 flex items-center gap-2">
                    {!a.read && <button className="px-2 py-1 rounded bg-black text-white text-xs" onClick={()=> onMarkRead(a.id)}>Mark read</button>}
                    {a.read && <span className="text-xs text-gray-500">Read</span>}
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
  );
}

/* -------------------- Auth (Login / Register) -------------------- */
export function Auth({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [username, setUsername] = useState(""); // email OR username
  const [email, setEmail] = useState("");       // only used in register
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

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

      // backend returns { ok:true, user_id }
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
      onRegister?.(data);
    } finally {
      setBusy(false);
    }
  };

  const canLogin = username.trim() && password;
  const canRegister = username.trim() && email.trim() && password;

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <Card>
        <div className="space-y-4 w-96">
          <h2 className="text-xl font-medium">
            {mode === "login" ? "Log in" : "Create account"}
          </h2>

          {/* Login: label as "Email or Username" */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Email or Username</div>
            <TextInput
              name="login"
              autoComplete="username"
              placeholder="you@example.com or yourname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Only show Email input in register mode */}
          {mode === "register" && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Email</div>
              <TextInput
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm text-gray-600">Password</div>
            <TextInput
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {mode === "login" ? (
            <>
              <Button onClick={doLogin} disabled={!canLogin || busy}>
                Log in
              </Button>
              <div className="text-sm text-gray-600">
                Don’t have an account?{" "}
                <button className="underline" onClick={() => setMode("register")}>
                  Create one
                </button>
              </div>
            </>
          ) : (
            <>
              <Button onClick={doRegister} disabled={!canRegister || busy}>
                Create account
              </Button>
              <div className="text-sm text-gray-600">
                Already have an account?{" "}
                <button className="underline" onClick={() => setMode("login")}>
                  Log in
                </button>
              </div>

              {/* Dev helper (optional). Keep only if you have this route wired. */}
              {import.meta.env.MODE === "development" && (
                <button
                  className="text-xs underline opacity-70"
                  onClick={async () => {
                    try {
                      const r = await fetch(`${API}/auth/register`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "x-test-signup-secret":
                            import.meta.env.VITE_TEST_SECRET || "dev-only-long-random",
                        },
                        body: JSON.stringify({ username, password }),
                      });
                      const data = await r.json().catch(() => null);
                      if (!r.ok) return alert((data && data.error) || "Dev register failed");
                      alert("Dev test user created. Log in now.");
                      setMode("login");
                    } catch (_) {}
                  }}
                >
                  Dev: quick test account (no email)
                </button>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

/* -------------------- Manager Home (Dashboard) -------------------- */
function ManagerDashboard({ user, club }){
  const [sports, setSports] = useState([]);
  const [editingId, setEditingId] = useState(null);

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
  const r = await fetch(`${API}/clubs/${club.id}/sports`, { credentials: 'include' });
    const data = await r.json().catch(() => null);
    if (!r.ok || !Array.isArray(data)) {
      setSports([]);
    } else {
      setSports(data);
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
          {sports.map(s => (
            <div key={s.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="text-sm">
                <div className="font-medium capitalize">{s.sport}</div>
                <div className="text-gray-600">
                  Courts {s.courts} • {s.open_hour}:00 - {s.close_hour}:00 • {s.slot_minutes} min
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                  onClick={() => startEdit(s)}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 rounded-lg bg-red-500 text-white hover:opacity-90"
                  onClick={() => remove(s)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {sports.length===0 && (
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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(null); // { courtIndex, time }
  const [bookFor, setBookFor] = useState('');   // manager-only: username to assign booking


  useEffect(()=>{
    (async ()=>{
      const r = await fetch(`${API}/clubs/${club.id}/sports`);
      const all = await r.json().catch(()=>null);
      if (!r.ok || !Array.isArray(all)) {
        setSports([]);
      } else {
        setSports(all);
        if (all.length) setSport(all[0].sport);
      }
    })();
  }, [club.id]);

  useEffect(()=>{
    if (!sport || !date) return;
    (async ()=>{
    const r = await fetch(`${API}/availability?clubId=${club.id}&sport=${sport}&date=${date}&userId=${user.id}`, { credentials: 'include' });
      const d = await r.json();
      if (r.ok) setGrid(d);
      else { setGrid(null); alert(d.error || 'error'); }
    })();
  }, [sport, date, club.id, user.id]);

  // Managers can book multiple & can cancel anyone's booking
  const isManager = user.role === 'manager';
  const isOwnClubManager = isManager && Number(club?.manager_id) === Number(user.id);
  const hasOwnBooking = isManager ? false : grid?.slots?.some(row => row.courts.some(c => c.owned));

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <div className="text-sm text-gray-600">Sport</div>
            <Select value={sport} onChange={e=>setSport(e.target.value)}>
              {sports.map(s => <option key={s.id} value={s.sport}>{s.sport}</option>)}
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-600">Date</div>
            <TextInput type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-[6px] h-[24px] rounded bg-green-500" /> <span className="text-sm">Available</span>
            <span className="inline-block w-[6px] h-[24px] rounded bg-orange-500" /> <span className="text-sm">Yours</span>
            <span className="inline-block w-[6px] h-[24px] rounded bg-red-500" /> <span className="text-sm">Unavailable</span>
          </div>
        </div>
      </Card>

      {grid && (
        <Card>
          <div className="overflow-auto">
            <table className="w-full border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left p-2">Time</th>
                  {Array.from({length: grid.cfg.courts}).map((_, i) => (
                    <th key={i} className="text-left p-2">Court {i+1}</th>
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
                          <button
                            onClick={() => openConfirm(cell.courtIndex, row.time)}
                            className={`w-full rounded bg-green-500 hover:opacity-90 relative
                                        min-h-12 sm:h-10 active:scale-[.98] transition
                                        ${hasOwnBooking ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={hasOwnBooking && !isManager}
                            aria-pressed="false"
                          >
                            <span className="sr-only">Book this slot</span>
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!grid && <Card><div className="text-sm text-gray-600">Select a sport and date to see slots.</div></Card>}

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
function ClubsPage({ user, club, onSetActive }) {
  const [clubs, setClubs] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newTimezone, setNewTimezone] = useState(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
  });
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

  const load = async () => {
    setError('');
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
    }
  };

  useEffect(() => { load(); }, []);

  const join = async () => {
    try {
      const res = await fetch(`${API}/clubs/join`, {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials: 'include',
        body: JSON.stringify({ code: joinCode.trim(), userId: user.id })
      });
      const data = await res.json().catch(()=>null);
      if (!res.ok) throw new Error((data && data.error) || 'Join failed');
      setJoinCode('');
      await load();
      onSetActive(data.club);
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
          {clubs.map(c => (
            <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="text-sm">
                <div className="font-medium">{c.name}</div>
                <div className="text-gray-600 text-xs"><CodeWithCopy code={c.code} /></div>
              </div>
              <div className="flex items-center gap-2">
                {/* Timezone selector only visible to the club's manager (creator) */}
                {Number(c.manager_id) === Number(user.id) && (
                  <div className="w-64">
                    <select
                      className="border rounded-lg px-3 py-2 w-full"
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
                )}
                {club && club.id === c.id ? (
                  <span className="text-xs px-2 py-1 rounded bg-gray-200">Active</span>
                ) : (
                  <Button onClick={() => onSetActive(c)}>Set active</Button>
                )}
              </div>
            </div>
          ))}
          {clubs.length === 0 && !error && (
            <div className="text-gray-500 text-sm">You’re not in any clubs yet.</div>
          )}
        </div>
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
    const r = await fetch(`${API}/tournaments/${tid}/signin`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    const data = await r.json();
    if (!r.ok) return alert(data.error || 'Sign in failed');
    await loadList();
    if (selectedId === tid) await openDetail(tid);
  };

  const withdraw = async (tid, tname) => {
    const ok = window.confirm(`Withdraw from "${tname}"?`);
    if (!ok) return;
    const r = await fetch(`${API}/tournaments/${tid}/signin`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
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
        <button onClick={loadList} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Refresh</button>

        {isManager && (
          <button
            className="ml-auto px-3 py-1 rounded bg-red-100 hover:bg-red-200"
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 min-h-[44px]" onClick={()=> openDetail(t.id)}>
                  View
                </button>

                {!isManager && !t.end_date && (
                  joined[t.id] ? (
                    <button className="px-4 py-2 rounded bg-red-100 hover:bg-red-200 min-h-[44px]"
                            onClick={()=> withdraw(t.id, t.name)}>Withdraw</button>
                  ) : (
                    <button className="px-4 py-2 rounded bg-black text-white min-h-[44px]"
                            onClick={()=> signIn(t.id, t.name)}>Sign in</button>
                  )
                )}

                {isManager && (
                  <button
                    className="sm:ml-auto px-4 py-2 rounded bg-red-100 hover:bg-red-200 min-h-[44px]"
                    onClick={()=> deleteTournament(t.id, t.name)}
                    title="Delete this tournament"
                  >
                    Delete
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
        <div className="overflow-x-auto">
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
