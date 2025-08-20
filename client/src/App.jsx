import React, { useEffect, useState } from 'react';
import Navbar from "./Navbar";

const API = window.API_BASE;

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
  const [page, setPage] = useState('book'); // 'book' | 'home' | 'clubs'

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
          setPage('book');                 // land on Book
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

  if (!club) return <ClubGate user={user} onJoin={(c)=>{saveClub(c); setPage('book');}} onCreate={(c)=>{saveClub(c); setPage('home');}} />;

  // If a non-manager ever hits "home", bounce them back to Book
  const effectivePage = user.role === 'manager' ? page : (page === 'home' ? 'book' : page);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        isManager={user.role === 'manager'}
        onBook={() => setPage('book')}
        onHome={() => setPage('home')}
        onClubs={() => setPage('clubs')}
      />
      <div className="max-w-5xl mx-auto p-4 space-y-4 flex-1">
        {effectivePage === 'clubs' ? (
          <ClubsPage
            user={user}
            club={club}
            onSetActive={(c) => { saveClub(c); setPage('book'); }}
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
    if (window.history.length > 1) {
      window.history.back();
    } else {
      localStorage.removeItem('user');
      location.reload();
    }
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
  const hasOwnBooking = isManager ? false : grid?.slots?.some(row => row.courts.some(c => c.owned));

  const openConfirm = (courtIndex, time) => {
    if (hasOwnBooking && !isManager) return;
    setPending({ courtIndex, time });
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
    const res = await fetch(`${API}/book`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ clubId: club.id, sport, courtIndex, date, time, userId: user.id })
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
                          // ORANGE: your booking → cancel
                          <button
                            onClick={() => cancelBooking(cell.bookingId)}
                            className="h-10 w-full rounded bg-orange-500 hover:opacity-90"
                            title="Click to cancel your reservation"
                          />
                        ) : cell.booked ? (
                          // RED: someone else booked
                          isManager ? (
                            // Managers can cancel any booking
                            <button
                              onClick={() => cancelBooking(cell.bookingId)}
                              className="h-10 w-full rounded bg-red-500 hover:opacity-90"
                              title="Manager: click to cancel this booking"
                            />
                          ) : (
                            <div className="h-10 rounded bg-red-500" />
                          )
                        ) : (
                          // GREEN: available
                          <button
                            onClick={() => openConfirm(cell.courtIndex, row.time)}
                            className={`h-10 w-full rounded bg-green-500 hover:opacity-90 ${hasOwnBooking ? 'opacity-50 cursor-not-allowed' : ''}`}
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
