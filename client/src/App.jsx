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

  function saveUser(u){ setUser(u); localStorage.setItem('user', JSON.stringify(u)); }
  function saveClub(c){ setClub(c); localStorage.setItem('club', JSON.stringify(c)); }

  if (!user) return <Onboarding onDone={saveUser} />;
  if (!club) return <ClubGate user={user} onJoin={saveClub} onCreate={saveClub} />;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-5xl mx-auto p-4 space-y-4 flex-1">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Club Booking</h1>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span>{user.name} ({user.role})</span>
            <span className="mx-2">•</span>
            <span>{club.name} (code {club.code})</span>
            <Button onClick={()=>{localStorage.clear(); location.reload();}}>Reset</Button>
          </div>
        </header>

        {user.role === 'manager' ?
          <ManagerDashboard user={user} club={club} /> :
          <UserBooking user={user} club={club} />
        }
      </div>
    </div>
  );
}

function Onboarding({ onDone }){
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const create = async () => {
    const res = await fetch(`${API}/users`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, role })});
    const data = await res.json();
    if (res.ok) onDone(data);
    else alert(data.error || 'error');
  };
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <Card>
        <div className="space-y-4 w-80">
          <h2 className="text-xl font-medium">Create your profile</h2>
          <TextInput placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
          <Select value={role} onChange={e=>setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="manager">Manager</option>
          </Select>
          <Button onClick={create} disabled={!name}>Continue</Button>
        </div>
      </Card>
    </div>
  );
}

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
    // if already joined/created a club → dashboard
    if (user.clubId) {
      location.reload(); // reload so app mounts at dashboard
    } else {
      alert("You need to join or create a club first!");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 relative">
      {/* Buttons row */}
      <div className="absolute top-4 left-4 flex gap-2">
        <button
          onClick={goBack}
          className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={goHome}
          className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
        >
          Home
        </button>
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


function ManagerDashboard({ user, club }){
  const [sports, setSports] = useState([]);
  const [form, setForm] = useState({ sport:'tennis', courts:4, openHour:8, closeHour:22, slotMinutes:60 });

  const load = async ()=> {
    const r = await fetch(`${API}/clubs/${club.id}/sports`);
    setSports(await r.json());
  };
  useEffect(()=>{ load(); }, []);

  const save = async ()=> {
    const res = await fetch(`${API}/clubs/${club.id}/sports`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, managerId: user.id })
    });
    const data = await res.json();
    if (res.ok) { await load(); }
    else alert(data.error || 'error');
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-lg font-medium mb-3">Add a sport</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Select value={form.sport} onChange={e=>setForm({...form, sport:e.target.value})}>
            <option value="tennis">Tennis</option>
            <option value="basketball">Basketball</option>
            <option value="football">Football</option>
          </Select>
          <TextInput type="number" placeholder="Courts" value={form.courts} onChange={e=>setForm({...form, courts:Number(e.target.value)})} />
          <TextInput type="number" placeholder="Open hour" value={form.openHour} onChange={e=>setForm({...form, openHour:Number(e.target.value)})} />
          <TextInput type="number" placeholder="Close hour" value={form.closeHour} onChange={e=>setForm({...form, closeHour:Number(e.target.value)})} />
          <Select value={form.slotMinutes} onChange={e=>setForm({...form, slotMinutes:Number(e.target.value)})}>
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
            <option value={120}>120</option>
          </Select>
          <Button onClick={save}>Save</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-medium mb-2">Configured sports</h3>
        <div className="grid gap-2">
          {sports.map(s => (
            <div key={s.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="text-sm">
                <div className="font-medium capitalize">{s.sport}</div>
                <div className="text-gray-600">Courts {s.courts} • {s.open_hour}:00 - {s.close_hour}:00 • {s.slot_minutes} min</div>
              </div>
            </div>
          ))}
          {sports.length===0 && <div className="text-gray-500 text-sm">No sports yet. Add one above.</div>}
        </div>
      </Card>
    </div>
  );
}

function UserBooking({ user, club }){
  const [sports, setSports] = useState([]);
  const [sport, setSport] = useState('');
  const [date, setDate] = useState(()=> new Date().toISOString().slice(0,10));
  const [grid, setGrid] = useState(null);

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
      const r = await fetch(`${API}/availability?clubId=${club.id}&sport=${sport}&date=${date}`);
      const d = await r.json();
      if (r.ok) setGrid(d);
      else { setGrid(null); alert(d.error || 'error'); }
    })();
  }, [sport, date, club.id]);

  const book = async (courtIndex, time) => {
    const res = await fetch(`${API}/book`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ clubId: club.id, sport, courtIndex, date, time, userId: user.id })
    });
    const data = await res.json();
    if (res.ok) {
      const r = await fetch(`${API}/availability?clubId=${club.id}&sport=${sport}&date=${date}`);
      setGrid(await r.json());
    } else {
      alert(data.error || 'error');
    }
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
                        {cell.booked ? (
                          <div className="h-10 rounded bg-red-500"></div>
                        ) : (
                          <button onClick={()=>book(cell.courtIndex, row.time)} className="h-10 w-full rounded bg-green-500 hover:opacity-90"></button>
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
    </div>
  );
}
