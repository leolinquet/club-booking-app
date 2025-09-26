// client/src/ClubGate.jsx
import React, { useState } from 'react';

// Resolve API base at runtime so deployed pages on Render talk to the correct host
const API = (() => {
  const h = typeof window !== 'undefined' ? window.location.hostname : '';
  const isRender = /\.onrender\.com$/i.test(h);
  let base = typeof window !== 'undefined' ? window.API_BASE : '';
  if (isRender && (!base || /localhost/.test(base))) {
    base = 'https://club-booking-app.onrender.com';
    if (typeof window !== 'undefined') window.API_BASE = base;
  }
  return base || 'http://localhost:5051';
})();

export default function ClubGate({ user, onJoin, onCreate }) {
  const [code, setCode] = useState('');
  const [clubName, setClubName] = useState('');
  const [timezone, setTimezone] = useState(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
  });

  // A small curated list of common America IANA timezones for convenience.
  const americaTimezones = [
    'America/New_York', // Eastern
    'America/Chicago',  // Central
    'America/Denver',   // Mountain (most)
    'America/Phoenix',  // Mountain (no DST)
    'America/Los_Angeles', // Pacific
    'America/Anchorage', // Alaska
    'America/Puerto_Rico', // Atlantic-like
    'America/Halifax', // Atlantic Canada
    'America/Sao_Paulo' // Brazil (common southern america tz)
  ];
  const [busy, setBusy] = useState(false);

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
      if (!res.ok) return alert(data.error || 'Join failed');
      onJoin(data.club);
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
        body: JSON.stringify({ name: clubName.trim(), managerId: user.id, timezone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return alert(data.error || 'Create failed');
      onCreate(data);
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

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
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
              <div className="mt-2">
                <label className="text-xs text-gray-600 block mb-1">Timezone</label>
                <select className="w-full rounded-lg border px-3 py-2" value={timezone} onChange={e=>setTimezone(e.target.value)}>
                  {/* Keep the detected timezone as the first option */}
                  <option value={timezone}>{timezone}</option>
                  <option value="UTC">UTC</option>
                  <optgroup label="America">
                    {americaTimezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <button
                className="px-3 py-2 rounded-lg bg-indigo-500 text-white disabled:opacity-60"
                onClick={create}
                disabled={!clubName || busy}
              >Create</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
