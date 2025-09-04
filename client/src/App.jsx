import React, { useEffect, useState } from 'react';
import Navbar from "./Navbar";

const API = (() => {
  const h = typeof window !== 'undefined' ? window.location.hostname : '';
  const isRender = /\.onrender\.com$/i.test(h);
  let base = typeof window !== 'undefined' ? window.API_BASE : '';
  if (isRender && (!base || /localhost/.test(base))) {
    base = 'https://club-booking-app.onrender.com';   // same API URL as above
    if (typeof window !== 'undefined') window.API_BASE = base;
  }
  return base || 'http://localhost:5051';
})();


function Card({ children }) {
  return <div className="bg-white rounded-xl shadow p-4">{children}</div>;
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
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')||'null'));
  const [club, setClub] = useState(() => JSON.parse(localStorage.getItem('club')||'null'));
  const [view, setView] = useState('book'); // 'book' | 'clubs' | 'home' | 'tournaments' | 'rankings'

  function saveUser(u){ setUser(u); localStorage.setItem('user', JSON.stringify(u)); }
  function saveClub(c){ setClub(c); localStorage.setItem('club', JSON.stringify(c)); }

  if (!user) {
    const handleAuthed = async (u) => {
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      try {
        const r = await fetch(`${API}/users/${u.id}/club`);
        if (r.ok) {
          const c = await r.json();
          localStorage.setItem('club', JSON.stringify(c));
          setClub(c);
          setView('book');                 // land on Book
        } else {
          localStorage.removeItem('club');
          setClub(null);
        }
      } catch {
        setClub(null);
      }
    };
    return <Auth onLogin={handleAuthed} onRegister={handleAuthed} />;
  }

  if (!club) return <ClubGate user={user} onJoin={(c)=>{saveClub(c); setView('book');}} onCreate={(c)=>{saveClub(c); setView('home');}} />;

  // Manager flag + page guard
  const isManager = user.role === 'manager';
  const effectivePage = isManager ? view : (view === 'home' ? 'book' : view);


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onBook={() => setView('book')}
        onHome={() => setView('home')}
        onClubs={() => setView('clubs')}
        onTournaments={() => setView('tournaments')}
        onRankings={() => setView('rankings')}
        isManager={isManager}
      />
      <div className="max-w-5xl mx-auto p-4 space-y-4 flex-1">
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
                <span>{club.name} (code {club.code})</span>
                <Button onClick={()=>{localStorage.clear(); location.reload();}}>Logout</Button>
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
                <span>{club.name} (code {club.code})</span>
                <Button onClick={()=>{localStorage.clear(); location.reload();}}>Logout</Button>
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
                <span>{club.name} (code {club.code})</span>
                <Button onClick={()=>{localStorage.clear(); location.reload();}}>Logout</Button>
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
                <span>{club.name} (code {club.code})</span>
                <Button onClick={()=>{localStorage.clear(); location.reload();}}>Logout</Button>
              </div>
            </header>
            <UserBooking user={user} club={club} />
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------- Auth (Login / Register) -------------------- */
function Auth({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name, password })
      });
      const data = await res.json().catch(()=>null);
      if (!res.ok) return alert((data && data.error) || 'Login failed');
      onLogin(data);
    } finally { setBusy(false); }
  };

  const register = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name, role, password })
      });
      const data = await res.json().catch(()=>null);
      if (!res.ok) return alert((data && data.error) || 'Register failed');
      onRegister(data);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <Card>
        <div className="space-y-4 w-96">
          <h2 className="text-xl font-medium">{mode === 'login' ? 'Log in' : 'Create account'}</h2>

          <div className="space-y-2">
            <div className="text-sm text-gray-600">Username</div>
            <TextInput placeholder="Your username" value={name} onChange={e=>setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-gray-600">Password</div>
            <TextInput type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Role</div>
              <Select value={role} onChange={e=>setRole(e.target.value)}>
                <option value="user">User</option>
                <option value="manager">Manager</option>
              </Select>
            </div>
          )}

          {mode === 'login' ? (
            <>
              <Button onClick={login} disabled={!name || !password || busy}>Log in</Button>
              <div className="text-sm text-gray-600">
                Don’t have an account?{' '}
                <button className="underline" onClick={()=>setMode('register')}>Create one</button>
              </div>
            </>
          ) : (
            <>
              <Button onClick={register} disabled={!name || !password || busy}>Create account</Button>
              <div className="text-sm text-gray-600">
                Already have an account?{' '}
                <button className="underline" onClick={()=>setMode('login')}>Log in</button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

/* -------------------- ClubGate (Join/Create) -------------------- */
function ClubGate({ user, onJoin, onCreate }){
  const [code, setCode] = useState('');
  const [clubName, setClubName] = useState('');

  const join = async ()=> {
    const res = await fetch(`${API}/clubs/join`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ code, userId:user.id })
    });
    const data = await res.json();
    if (res.ok) onJoin(data.club);
    else alert(data.error || 'error');
  };

  const create = async ()=> {
    const res = await fetch(`${API}/clubs`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: clubName, managerId: user.id })
    });
    const data = await res.json();
    if (res.ok) onCreate(data);
    else alert(data.error || 'error');
  };

  const goBack = () => {
  // clear any stored user
  localStorage.removeItem('user');
  // force reload at root (your login/creation page)
  window.location.href = '/';
};


  const goHome = () => {
    if (user.clubId) {
      location.reload();
    } else {
      alert("You need to join or create a club first!");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 relative">
      <div className="absolute top-4 left-4 flex gap-2">
        <button onClick={goBack} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">Back</button>
        <button onClick={goHome} className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300">Home</button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Card>
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Join a club</h3>
            <TextInput placeholder="Enter club code" value={code} onChange={e=>setCode(e.target.value)} />
            <Button onClick={join} disabled={!code}>Join</Button>
          </div>
        </Card>

        {user.role === 'manager' && (
          <Card>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Create a club</h3>
              <TextInput placeholder="Club name" value={clubName} onChange={e=>setClubName(e.target.value)} />
              <Button onClick={create} disabled={!clubName}>Create</Button>
            </div>
          </Card>
        )}
      </div>
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
    const r = await fetch(`${API}/clubs/${club.id}/sports`);
    setSports(await r.json());
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
      sport: actualSport,
      courts: Number(form.courts),
      openHour: Number(form.openHour),
      closeHour: Number(form.closeHour),
      slotMinutes: actualMinutes,
      managerId: user.id
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
      body: JSON.stringify({ managerId: user.id })
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
      <Card>
        <h3 className="text-lg font-medium mb-3">
          {editingId ? 'Edit sport' : 'Add a sport'}
        </h3>

        {/* Field labels on top as requested */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">Sport</div>
            <Select
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
                <TextInput
                  placeholder="Type sport name (e.g., Hockey)"
                  value={form.customSport}
                  onChange={e=>setForm(f=>({...f, customSport:e.target.value}))}
                />
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Courts / Fields</div>
            <TextInput type="number" value={form.courts}
              onChange={e=>setForm({...form, courts:Number(e.target.value)})}/>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Open time (0–23)</div>
            <TextInput type="number" value={form.openHour}
              onChange={e=>setForm({...form, openHour:Number(e.target.value)})}/>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Closing time (1–24)</div>
            <TextInput type="number" value={form.closeHour}
              onChange={e=>setForm({...form, closeHour:Number(e.target.value)})}/>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Time slots (minutes)</div>
            <Select
              value={form.slotChoice}
              onChange={e=>setForm(f=>({...f, slotChoice: isNaN(+e.target.value) ? e.target.value : Number(e.target.value)}))}
            >
              {SLOT_PRESETS.map(m => <option key={m} value={m}>{m}</option>)}
              <option value="__custom__">Custom…</option>
            </Select>
            {form.slotChoice === '__custom__' && (
              <div className="mt-2">
                <TextInput
                  type="number"
                  placeholder="Minutes (5–240)"
                  value={form.customMinutes}
                  onChange={e=>setForm(f=>({...f, customMinutes:e.target.value}))}
                />
              </div>
            )}
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={save}>{editingId ? 'Update' : 'Save'}</Button>
            {editingId && (
              <button className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </Card>

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
          {sports.length===0 && <div className="text-gray-500 text-sm">No sports yet. Add one above.</div>}
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
      const all = await r.json();
      setSports(all);
      if (all.length) setSport(all[0].sport);
    })();
  }, [club.id]);

  useEffect(()=>{
    if (!sport || !date) return;
    (async ()=>{
      const r = await fetch(`${API}/availability?clubId=${club.id}&sport=${sport}&date=${date}&userId=${user.id}`);
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
    const r = await fetch(`${API}/availability?clubId=${club.id}&sport=${sport}&date=${date}&userId=${user.id}`);
    setGrid(await r.json());
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
    method:'POST', headers:{'Content-Type':'application/json'},
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
  if (!res.ok) alert((data && data.error) || 'Booking failed');
  closeConfirm();
  await refresh();
};


  const cancelBooking = async (bookingId) => {
    const yes = confirm('Cancel this reservation?');
    if (!yes) return;
    const res = await fetch(`${API}/cancel`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ bookingId, userId: user.id })
    });
    const data = await res.json().catch(()=>null);
    if (!res.ok) alert((data && data.error) || 'Cancel failed');
    await refresh();
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid md:grid-cols-4 gap-3 items-end">
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
            <span className="inline-block w-4 h-4 rounded bg-green-500" /> <span className="text-sm">Available</span>
            <span className="inline-block w-4 h-4 rounded bg-orange-500" /> <span className="text-sm">Yours</span>
            <span className="inline-block w-4 h-4 rounded bg-red-500" /> <span className="text-sm">Unavailable</span>
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
                    <td className="p-2 text-sm text-gray-700">{row.time}</td>
                    {row.courts.map(cell => (
                    <td key={cell.courtIndex} className="p-1">
                      {cell.owned ? (
                        // ORANGE: your booking → cancel (owner; managers see label too)
                        <button
                          onClick={() => cancelBooking(cell.bookingId)}
                          className="h-10 w-full rounded bg-orange-500 hover:opacity-90 relative"
                          title="Click to cancel your reservation"
                        >
                          {isOwnClubManager && cell.bookedBy && (
                            <span className="absolute inset-0 grid place-items-center text-[11px] text-white font-medium">
                              {cell.bookedBy}
                            </span>
                          )}
                        </button>
                      ) : cell.booked ? (
                        isManager ? (
                          // RED: someone else booked → managers can cancel any; managers see label
                          <button
                            onClick={() => cancelBooking(cell.bookingId)}
                            className="h-10 w-full rounded bg-red-500 hover:opacity-90 relative"
                            title="Manager: click to cancel this booking"
                          >
                            {isOwnClubManager && cell.bookedBy && (
                              <span className="absolute inset-0 grid place-items-center text-[11px] text-white font-medium">
                                {cell.bookedBy}
                              </span>
                            )}
                          </button>
                        ) : (
                          // regular users just see solid red block
                          <div className="h-10 rounded bg-red-500" />
                        )
                      ) : (
                        // GREEN: available
                        <button
                          onClick={() => openConfirm(cell.courtIndex, row.time)}
                          className={`h-10 w-full rounded bg-green-500 hover:opacity-90 ${hasOwnBooking ? 'opacity-50 cursor-not-allowed' : ''} relative`}
                          disabled={hasOwnBooking && !isManager}
                        />
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
  const [error, setError] = useState('');
  const isManager = user.role === 'manager';

  const load = async () => {
    setError('');
    try {
      const r = await fetch(`${API}/users/${user.id}/clubs`);
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
        method:'POST', headers:{'Content-Type':'application/json'},
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
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name: newName.trim(), managerId: user.id })
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
                <div className="text-gray-600 text-xs">code {c.code}</div>
              </div>
              {club && club.id === c.id ? (
                <span className="text-xs px-2 py-1 rounded bg-gray-200">Active</span>
              ) : (
                <Button onClick={() => onSetActive(c)}>Set active</Button>
              )}
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
            <TextInput placeholder="Club name" value={newName} onChange={e=>setNewName(e.target.value)} disabled={!isManager}/>
            <Button onClick={create} disabled={!newName.trim() || !isManager}>Create</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TournamentsView({ API, club, user, isManager }) {
  const [list, setList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'completed' | 'all'
  const [loading, setLoading] = useState(false);

  // creation form (manager)
  const [name, setName] = useState('');
  const [sport, setSport] = useState('tennis');
  const [drawSize, setDrawSize] = useState(16);
  const [seedCount, setSeedCount] = useState(4);
  const [pointsByRound, setPointsByRound] = useState({
    R128: 0, R64: 0, R32: 10, R16: 20, QF: 40, SF: 70, F: 120, C: 150
  });

  // selected tournament details
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null); // { tournament, players:[{id,display_name,seed}], matches, points }

  const roundLabelsFor = (sz) => {
    const map = [
      { label: 'R128', size: 128 },
      { label: 'R64',  size:  64 },
      { label: 'R32',  size:  32 },
      { label: 'R16',  size:  16 },
      { label: 'QF',   size:   8 },
      { label: 'SF',   size:   4 },
      { label: 'F',    size:   2 },
      { label: 'C',    size:   1 }
    ];
    return map.filter(x => x.size <= sz).map(x => x.label);
  };

  const loadList = async () => {
    if (!club) return;
    setLoading(true);
    const q = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
    const r = await fetch(`${API}/clubs/${club.id}/tournaments${q}`);
    const data = await r.json();
    setList(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { loadList(); }, [club?.id, statusFilter]);

  const createTournament = async () => {
    if (!isManager) return;
    if (!name.trim()) return alert('Name required');
    // Build points only for the necessary rounds based on drawSize
    const needed = roundLabelsFor(Number(drawSize));
    const pts = {};
    needed.forEach(lbl => { pts[lbl] = Number(pointsByRound[lbl] || 0); });

    const r = await fetch(`${API}/clubs/${club.id}/tournaments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(), sport, drawSize: Number(drawSize),
        seedCount: Number(seedCount),
        pointsByRound: pts,
        managerId: user.id
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
    const data = await r.json();
    setDetail(data);
  };

  // Managers: add players (by usernames, comma-separated)
  const [playerIdsText, setPlayerIdsText] = useState('');
  const addPlayers = async () => {
    if (!selectedId) return;
    const names = playerIdsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (!names.length) return alert('Enter usernames separated by commas');
    const r = await fetch(`${API}/tournaments/${selectedId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: names, managerId: user.id })
    });
    const data = await r.json();
    if (!r.ok) return alert(data.error || 'Add players failed');
    setPlayerIdsText('');
    await openDetail(selectedId);
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
    playersById = new Map(detail.players.map(p => [p.id, { name: p.display_name, seed: p.seed ?? null }]));
  }

  function NameWithSeed({ pid }) {
    const info = playersById.get(pid);
    if (!info) return <span className="truncate">TBD</span>;
    return (
      <span className="inline-flex items-baseline gap-1 truncate">
        {info.seed ? (
          <span className="text-[10px] leading-none opacity-70 w-3 text-right">{info.seed}</span>
        ) : (
          <span className="w-3" />
        )}
        <span className="truncate">{info.name}</span>
      </span>
    );
  }


  // Render bracket columns grouped by round (DESC -> left to right)
  const renderBracket = () => {
    if (!detail || !detail.matches?.length) {
      return <div className="text-sm text-gray-500">No matches yet.</div>;
    }

    const rounds = [...new Set(detail.matches.map(m => m.round))].sort((a, b) => b - a);

    // compute final winner (if any) to show Champion box
    const finalMatchWithWinner = detail.matches.find(m => m.round === 1 && m.winner_id);
    const championId = finalMatchWithWinner?.winner_id ?? null;
    const championInfo = championId ? playersById.get(championId) : null;

    return (
      <div className="w-full overflow-x-auto">
        <div className="flex gap-6 items-start">
          {/* Bracket rounds (left → right) */}
          {rounds.map(rnd => {
            const ms = detail.matches.filter(m => m.round === rnd);
            const title =
              rnd === 1 ? 'Final' :
              rnd === 2 ? 'Semifinal' :
              rnd === 3 ? 'Quarterfinal' :
              `Round ${rnd}`;

            return (
              <div key={rnd} className="min-w-[240px]">
                <div className="text-sm font-semibold mb-2">{title}</div>
                <div className="flex flex-col gap-3">
                  {ms.map(m => {
                    const completed = m.status === 'completed';
                    return (
                      <div key={m.id} className="border rounded-lg p-3 bg-white shadow-sm">
                        <div className="flex justify-between">
                          <div className={`truncate ${m.winner_id === m.p1_id ? 'font-semibold' : ''}`}>
                            <NameWithSeed pid={m.p1_id} />
                          </div>
                          <div className="text-xs text-gray-500">{completed ? m.p1_score : ''}</div>
                        </div>
                        <div className="flex justify-between">
                          <div className={`truncate ${m.winner_id === m.p2_id ? 'font-semibold' : ''}`}>
                            <NameWithSeed pid={m.p2_id} />
                          </div>
                          <div className="text-xs text-gray-500">{completed ? m.p2_score : ''}</div>
                        </div>

                        {isManager && m.status !== 'completed' && m.p1_id && m.p2_id && (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="P1"
                              className="border rounded px-2 py-1 w-16"
                              onChange={(e) => (m._p1 = Number(e.target.value))}
                            />
                            <input
                              type="number"
                              placeholder="P2"
                              className="border rounded px-2 py-1 w-16"
                              onChange={(e) => (m._p2 = Number(e.target.value))}
                            />
                            <button
                              className="px-3 py-1 rounded bg-black text-white"
                              onClick={() => reportResult(m.id, m._p1 ?? 0, m._p2 ?? 0)}
                            >
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

          {/* Champion panel (appears when final has a winner) */}
          {championInfo && (
            <div className="min-w-[220px]">
              <div className="text-sm font-semibold mb-2">Champion</div>
              <div className="rounded-lg border p-4 bg-white shadow-sm">
                <div className="text-base font-medium">
                  <span className="inline-flex items-baseline gap-1">
                    {championInfo.seed ? (
                      <span className="text-[10px] leading-none opacity-70 w-3 text-right">{championInfo.seed}</span>
                    ) : <span className="w-3" />}
                    <span>{championInfo.name}</span>
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Awarded Final points</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Report result (frontend validation)
  const reportResult = async (matchId, p1_score, p2_score) => {
    const s1 = Number(p1_score);
    const s2 = Number(p2_score);

    if (!Number.isFinite(s1) || !Number.isFinite(s2)) {
      alert('Enter both scores');
      return;
    }
    if (s1 === s2) {
      alert('Scores must not tie');
      return;
    }

    const r = await fetch(`${API}/matches/${matchId}/result`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerId: user.id, p1_score: s1, p2_score: s2 })
    });
    const data = await r.json().catch(()=>null);
    if (!r.ok) return alert((data && data.error) || 'Save failed');
    await openDetail(selectedId);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Filters and list */}
      <div className="flex items-center gap-3">
        <select
          className="border rounded px-2 py-1"
          value={statusFilter}
          onChange={(e)=> setStatusFilter(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>
        <button onClick={loadList} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {list.map(t => (
            <div key={t.id} className="border rounded-lg p-3 bg-white shadow-sm">
              <div className="text-sm font-semibold">{t.name} · {t.sport} {t.end_date ? '· Completed' : '· Active'}</div>
              <div className="mt-2">
                <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={()=> openDetail(t.id)}>
                  View
                </button>
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

            {/* If your backend allows any integer up to 32: use input. Otherwise keep your old select. */}
            <input
              type="number"
              min={0}
              max={Math.min(32, Number(drawSize))}
              className="border rounded px-3 py-2"
              value={seedCount}
              onChange={e=>setSeedCount(Number(e.target.value))}
            />
          </div>

          {/* Points by round (only show labels needed for drawSize) */}
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-7 gap-2">
            {roundLabelsFor(Number(drawSize)).map(lbl => (
              <div key={lbl} className="flex items-center gap-2">
                <span className="text-xs w-10 text-gray-600">{lbl}</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-20"
                  value={pointsByRound[lbl] ?? 0}
                  onChange={e => setPointsByRound(prev => ({ ...prev, [lbl]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button className="px-4 py-2 rounded bg-black text-white" onClick={createTournament}>
              Create
            </button>
          </div>
        </div>
      )}

      {/* Detail / Bracket */}
      {detail && (
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">{detail.tournament.name} · {detail.tournament.sport}</div>
            <button className="text-sm text-gray-500 hover:underline" onClick={()=> setDetail(null)}>Close</button>
          </div>

          {isManager && !detail.tournament.end_date && (
            <div className="mt-3 grid md:grid-cols-2 gap-3">
              <div className="border rounded p-3">
                <div className="text-sm font-medium mb-2">Add Players (usernames, comma-separated)</div>
                <input
                  className="border rounded px-2 py-1 w-full"
                  placeholder="e.g., alice, bob, charlie"
                  value={playerIdsText}
                  onChange={e=>setPlayerIdsText(e.target.value)}
                />
                <button className="mt-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" onClick={addPlayers}>
                  Add
                </button>
              </div>

              <div className="border rounded p-3">
                <div className="text-sm font-medium mb-2">Generate Bracket</div>
                <div className="flex gap-2 items-center">
                  <select className="border rounded px-2 py-1" value={drawSize} onChange={e=>setDrawSize(Number(e.target.value))}>
                    {[4,8,16,32,64,128].map(n=> <option key={n} value={n}>{n}</option>)}
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={Math.min(32, Number(drawSize))}
                    className="border rounded px-2 py-1 w-20"
                    value={seedCount}
                    onChange={e=>setSeedCount(Number(e.target.value))}
                  />
                  <button className="px-3 py-1 rounded bg-black text-white" onClick={generateBracket}>
                    Generate
                  </button>
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
    const r = await fetch(`${API}/clubs/${club.id}/standings`);
    const data = await r.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, [club?.id]);

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
                  <td className="py-2 pr-4">{i + 1}</td>
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4">{r.tournaments_played}</td>
                  <td className="py-2 pr-4">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


