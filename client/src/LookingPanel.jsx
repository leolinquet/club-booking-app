import React, { useEffect, useState } from 'react';

// Prefer the runtime-resolved API base (window.API_BASE) set by App.jsx; fall back to Vite env.
// Only treat it as a usable API base if it's a valid absolute URL.
const RAW_API = (typeof window !== 'undefined' && window.API_BASE) ? String(window.API_BASE) : (import.meta.env.VITE_API_BASE || '');
function isAbsoluteHttpUrl(u) {
  try { return typeof u === 'string' && /^https?:\/\//i.test(u); } catch { return false; }
}
const API_BASE = isAbsoluteHttpUrl(RAW_API) ? RAW_API.replace(/\/+$/,'') : '';

function safeParse(s){ try { return JSON.parse(s); } catch { return null; } }

export default function LookingPanel({ show, onClose, user, club }){
  const [list, setList] = useState([]);
  // server usage is determined by VITE_API_BASE; no manual toggle required
  const [pending, setPending] = useState({}); // { [player_id]: status }
  const [requests, setRequests] = useState([]); // unified list: { reqId, fromUserId, fromName, toUserId, toName, player, ts, status }
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(()=>{
    if (!show) return;
    (async ()=>{
      if (!club) return setList([]);
      // Only call backend when API_BASE is explicitly configured (to avoid noisy errors in dev)
      const hasServer = Boolean(API_BASE);
  if (hasServer) {
        try {
          const r = await fetch(`${API_BASE}/clubs/${club.id}/looking`, { credentials: 'include' });
          const d = await r.json().catch(()=>null);
          if (r.ok && Array.isArray(d)) return setList(d);
        } catch (e) {
          // network error: fallthrough to local mock below
        }
      }
      // fallback mock data for local QA
      setList([
        { player_id: 1, user_id: 101, display_name: 'Alice', looking_since: Date.now() - 1000*60*5 },
        { player_id: 2, user_id: 102, display_name: 'Bob', looking_since: Date.now() - 1000*60*12 },
      ]);
    })();
  }, [show, club]);

  // whether the current user is marked as looking (visible to others)
  const [isMeLooking, setIsMeLooking] = useState(false);
  // show optional time picker modal when the user clicks "I am looking"
  const [showTimeModal, setShowTimeModal] = useState(false);
  // store as local input values (datetime-local strings) while editing, but persist ISO strings
  const [requestedFrom, setRequestedFrom] = useState(''); // local input value like '2025-10-02T10:00'
  const [requestedTo, setRequestedTo] = useState('');

  // Helper: format a looking range only when both are present and valid ISO strings
  function formatLookingRange(lookingFrom, lookingTo) {
    try {
      if (!lookingFrom || !lookingTo) return null;
      const d1 = new Date(lookingFrom);
      const d2 = new Date(lookingTo);
      if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null;
      // require both for a range; if to < from, consider invalid
      if (d2.getTime() < d1.getTime()) return null;
      const opts = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' };
      const fmt = new Intl.DateTimeFormat(undefined, opts);
      return `${fmt.format(d1)} - ${fmt.format(d2)}`;
    } catch (e) { return null; }
  }

  useEffect(() => {
    if (!show) return;
    if (!user) return setIsMeLooking(false);
    // determine from fetched list whether current user is in it
    const me = (list || []).find(p => p.user_id && Number(p.user_id) === Number(user.id));
    setIsMeLooking(!!me);
  }, [show, list, user]);

  const toggleMyLooking = async (opts = {}) => {
    // opts: { requested_time } when turning on
    if (!user || !club) return alert('Login and club required');
    const desired = !isMeLooking;
    // when enabling, if no opts.requested_time provided, the caller may have opened the modal
    // optimistic UI
    setIsMeLooking(desired);
    try {
    // try server API first only when VITE_API_BASE is explicitly set
  const hasServer = Boolean(API_BASE);
  if (hasServer) {
        const body = { userId: user.id, looking: desired };
        // persist as ISO strings named lookingFrom/lookingTo per API model
        if (opts.requested_from) body.lookingFrom = opts.requested_from;
        if (opts.requested_to) body.lookingTo = opts.requested_to;
        try {
          const r = await fetch(`${API_BASE}/clubs/${club.id}/looking`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify(body)
          });
          if (r.ok) {
            // reload list from server (best-effort) but don't early-return — we still update local presence so same-tab UI reflects chosen times
            try { const res2 = await fetch(`${API_BASE}/clubs/${club.id}/looking`, { credentials: 'include' }); const arr = await res2.json().catch(()=>[]); setList(Array.isArray(arr) ? arr : []); } catch (e) {}
          }
        } catch (e) {
          // network error — we'll proceed to local fallback below
        }
      }
    } catch (e) {
      // network error — fallback below
    }

    // fallback: update local mock list (for dev without backend)
    setList(prev => {
      if (desired) {
        // add current user to list if missing
        const exists = prev.find(p => p.user_id && Number(p.user_id) === Number(user.id));
        if (exists) {
          // update existing entry with requested range and new timestamp
          return prev.map(p => {
            if (p.user_id && Number(p.user_id) === Number(user.id)) {
              return {
                ...p,
                requested_from: opts.requested_from || p.requested_from || null,
                requested_to: opts.requested_to || p.requested_to || null,
                looking_since: Date.now()
              };
            }
            return p;
          });
        }
  const newRow = { player_id: Date.now(), user_id: user.id, display_name: user.display_name || user.name || `User ${user.id}`, looking_since: Date.now() };
  if (opts.requested_from) newRow.lookingFrom = opts.requested_from;
  if (opts.requested_to) newRow.lookingTo = opts.requested_to;
        return [newRow, ...prev];
      } else {
        // remove current user
        return prev.filter(p => !(p.user_id && Number(p.user_id) === Number(user.id)));
      }
    });
    // persist to localStorage so other tabs receive storage events
    try {
      const key = `club_booking_looking:${club.id}:${user.id}`;
      if (desired) {
  const payload = { userId: user.id, display_name: user.display_name || user.name || `User ${user.id}`, ts: Date.now(), player_id: `local-${user.id}` };
  if (opts.requested_from) payload.lookingFrom = opts.requested_from;
  if (opts.requested_to) payload.lookingTo = opts.requested_to;
        localStorage.setItem(key, JSON.stringify(payload));
        // also update in-memory list immediately so same-tab UI reflects the chosen times
        try {
          setList(prev => {
            const filtered = prev.filter(p => !(p.user_id && String(p.user_id) === String(user.id)));
            const row = { player_id: payload.player_id || `local-${payload.userId}`, user_id: payload.userId, display_name: payload.display_name, looking_since: payload.ts || Date.now(), lookingFrom: payload.lookingFrom || null, lookingTo: payload.lookingTo || null };
            return [row, ...filtered];
          });
        } catch (e) {}
        // notify same-tab listeners (App) so the global count updates immediately
        try { window.dispatchEvent(new CustomEvent('club_booking_looking_change', { detail: { clubId: club.id, userId: user.id, looking: true, payload } })); } catch (e) {}
      } else {
        localStorage.removeItem(key);
        try { window.dispatchEvent(new CustomEvent('club_booking_looking_change', { detail: { clubId: club.id, userId: user.id, looking: false } })); } catch (e) {}
      }
    } catch (e) {}
  };

  // Called when the user clicks the UI button. If enabling, show the optional time modal.
  const onClickLookingButton = () => {
    if (!isMeLooking) {
      // opening: show modal to optionally collect a time
      try {
        const key = `club_booking_looking:${club?.id}:${user?.id}`;
        const payload = safeParse(localStorage.getItem(key)) || {};
        // helper: convert ISO to datetime-local input value
        const isoToInput = (iso) => {
          try {
            if (!iso) return '';
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return '';
            const pad = (n) => String(n).padStart(2, '0');
            const y = d.getFullYear();
            const m = pad(d.getMonth() + 1);
            const day = pad(d.getDate());
            const hh = pad(d.getHours());
            const mm = pad(d.getMinutes());
            return `${y}-${m}-${day}T${hh}:${mm}`;
          } catch (e) { return ''; }
        };
        const lf = payload.lookingFrom || payload.requested_from || null;
        const lt = payload.lookingTo || payload.requested_to || null;
        setRequestedFrom(isoToInput(lf));
        setRequestedTo(isoToInput(lt));
      } catch (e) {
        setRequestedFrom(''); setRequestedTo('');
      }
      setShowTimeModal(true);
      return;
    }
    // if already looking, just toggle off
    toggleMyLooking();
  };

  useEffect(()=>{
    const onStorage = (e) => {
      // quick prune for stale index entries when storage changes
      try {
        const now = Date.now();
        const THRESH = 24 * 60 * 60 * 1000;
        if (e.key && (String(e.key).startsWith('club_booking_request_index:') || String(e.key).startsWith('club_booking_response_index:'))) {
          const payload = safeParse(localStorage.getItem(e.key));
          const ts = payload ? Number(payload.ts || payload.t || 0) : 0;
          if (!ts) {
            // if no timestamp, remove entry to avoid showing stale items
            try { localStorage.removeItem(e.key); } catch (err) {}
          } else if (Date.now() - ts > THRESH) {
            try { localStorage.removeItem(e.key); } catch (err) {}
          }
        }
      } catch (err) {}
      try {
        if (!e.key || !e.newValue) return;
        const k = String(e.key);
        // listen for other tabs signalling that a user toggled their looking state
        if (k.startsWith('club_booking_looking:')) {
          const parts = k.split(':');
          const clubId = parts[1];
          const uid = parts[2];
          if (String(club?.id) === String(clubId)) {
            const payload = safeParse(e.newValue) || null;
            // payload === null indicates removal / stop-looking
            setList(prev => {
              const filtered = prev.filter(p => !(p.user_id && String(p.user_id) === String(uid)));
              if (payload) {
                const row = { player_id: payload.player_id || (payload.userId ? `local-${payload.userId}` : Date.now()), user_id: payload.userId, display_name: payload.display_name, looking_since: payload.ts || Date.now(), lookingFrom: payload.lookingFrom || payload.requested_from || null, lookingTo: payload.lookingTo || payload.requested_to || null };
                return [row, ...filtered];
              }
              return filtered;
            });
          }
          return;
        }
        if (k.startsWith('club_booking_request:')){
          const parts = k.split(':');
          const recipientId = parts[1];
          const payload = safeParse(e.newValue) || {};
          const reqId = payload.reqId || parts[2] || String(Date.now());
          // Build unified request entry
          const entry = {
            reqId,
            fromUserId: payload.fromUserId,
            fromName: payload.fromName || payload.from || 'Someone',
            toUserId: Number(recipientId),
            toName: payload.toName || null,
            player: payload.player || { player_id: payload.player_id },
            ts: payload.ts || Date.now(),
            status: 'pending'
          };
          setRequests(prev => {
            if (prev.find(r => String(r.reqId) === String(reqId))) return prev;
            return [entry, ...prev];
          });
        }
        if (k.startsWith('club_booking_response:')){
          const payload = safeParse(e.newValue) || {};
          if (payload && payload.player_id) {
            // update pending map
            setPending(prev => ({ ...prev, [payload.player_id]: payload.status }));
            // also update unified requests list by matching reqId or player_id
            setRequests(prev => prev.map(r => {
              if (String(r.reqId) === String(payload.reqId) || String(r.player?.player_id) === String(payload.player_id)) {
                return { ...r, status: payload.status };
              }
              return r;
            }));
          }
        }
        if (k.startsWith('club_booking_response_index:')){
          // structured response index written by recipient; update requests
          const payload = safeParse(e.newValue) || {};
          if (payload && payload.reqId) {
            setRequests(prev => prev.map(r => (String(r.reqId) === String(payload.reqId) ? { ...r, status: payload.status } : r)));
            if (payload.player_id) setPending(prev => ({ ...prev, [payload.player_id]: payload.status }));
          }
        }
      } catch (err) {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]);


  // merge any localStorage looking entries into the list on mount/load
  useEffect(() => {
    if (!show || !club) return;
    // Prune stale request/response index entries older than 24 hours
    try {
      const now = Date.now();
      const THRESH = 24 * 60 * 60 * 1000; // 24 hours
      const keys = Object.keys(localStorage || {});
      for (const k of keys) {
        try {
          if (k.startsWith('club_booking_request_index:') || k.startsWith('club_booking_response_index:')) {
            const payload = safeParse(localStorage.getItem(k));
            if (!payload) { localStorage.removeItem(k); continue; }
            const ts = Number(payload.ts || payload.t || payload.created_at || payload.ts_ms || 0) || 0;
            // fallback: if no ts present, attempt to parse reqId timestamp prefix
            let created = ts;
            if (!created && payload.reqId) {
              const m = String(payload.reqId).match(/^(\d{13})-/);
              if (m) created = Number(m[1]);
            }
            if (!created) {
              // if we still don't know when it was created, remove to avoid stale junk
              localStorage.removeItem(k);
              continue;
            }
            if (now - created > THRESH) {
              localStorage.removeItem(k);
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
    try {
      const keys = Object.keys(localStorage || {}).filter(k => k.startsWith(`club_booking_looking:${club.id}:`));
      if (!keys.length) return;
        const rows = keys.map(k => {
        const payload = safeParse(localStorage.getItem(k));
        if (!payload) return null;
        return { player_id: payload.player_id || `local-${payload.userId}`, user_id: payload.userId, display_name: payload.display_name, looking_since: payload.ts || Date.now(), lookingFrom: payload.lookingFrom || payload.requested_from || null, lookingTo: payload.lookingTo || payload.requested_to || null };
      }).filter(Boolean);
      if (rows.length) setList(prev => {
        // dedupe by user_id
        const map = {};
        rows.forEach(r => { map[String(r.user_id)] = r; });
        prev.forEach(r => { if (!map[String(r.user_id)]) map[String(r.user_id)] = r; });
        return Object.values(map);
      });
  } catch (e) {}
    // load request indices for this user (both incoming and outgoing) by scanning request_index keys
    try {
      if (!user) return;
      const idxKeys = Object.keys(localStorage || {}).filter(k => k.startsWith('club_booking_request_index:'));
      if (idxKeys.length) {
        const entries = idxKeys.map(k => safeParse(localStorage.getItem(k))).filter(Boolean).map(x => ({ reqId: x.reqId, fromUserId: x.fromUserId, fromName: x.fromName, toUserId: x.toUserId || null, toName: x.toName || null, player: x.player, ts: x.ts }));
        if (entries.length) setRequests(prev => {
          const map = {};
          prev.forEach(r => { map[String(r.reqId)] = r; });
          entries.forEach(e => { if (!map[String(e.reqId)]) map[String(e.reqId)] = { reqId: e.reqId, fromUserId: e.fromUserId, fromName: e.fromName, toUserId: e.toUserId, toName: e.toName, player: e.player, ts: e.ts, status: 'pending' }; });
          return Object.values(map);
        });
      }
    } catch (e) {}
    // also load any response_index entries to reconcile statuses
    try {
      const respIdx = Object.keys(localStorage || {}).filter(k => k.startsWith('club_booking_response_index:'));
      if (respIdx.length) {
        const respEntries = respIdx.map(k => safeParse(localStorage.getItem(k))).filter(Boolean);
        if (respEntries.length) setRequests(prev => {
          const map = {};
          prev.forEach(r => { map[String(r.reqId)] = r; });
          respEntries.forEach(re => {
            if (map[String(re.reqId)]) map[String(re.reqId)] = { ...map[String(re.reqId)], status: re.status };
            else map[String(re.reqId)] = { reqId: re.reqId, fromUserId: re.fromUserId, fromName: re.fromName, toUserId: re.toUserId, toName: re.toName, player: re.player, ts: re.ts, status: re.status };
          });
          return Object.values(map);
        });
      }
    } catch (e) {}
  }, [show, club]);
  // Helper: prefer stored lookingFrom/lookingTo from localStorage when rendering
  function getPlayerRange(p) {
    try {
      const lf = p.lookingFrom || p.requested_from || null;
      const lt = p.lookingTo || p.requested_to || null;
      if (lf && lt) return formatLookingRange(lf, lt);
      // fallback: check localStorage entry for this player/user
      const uid = p.user_id || p.userId || p.player_id;
      if (!club || !uid) return null;
      const key = `club_booking_looking:${club.id}:${uid}`;
      const payload = safeParse(localStorage.getItem(key));
      if (!payload) return null;
      const lf2 = payload.lookingFrom || payload.requested_from || null;
      const lt2 = payload.lookingTo || payload.requested_to || null;
      if (lf2 && lt2) return formatLookingRange(lf2, lt2);
    } catch (e) {
      // ignore
    }
    return null;
  }
  const sendRequest = (p) => {
    if (!user) return alert('Login required');
    if (!isMeLooking) return alert('You must click "I am looking" to send requests.');
    // Prevent duplicate pending requests from the current user to the same recipient/player combination
    const already = requests.find(r =>
      String(r.fromUserId) === String(user?.id) &&
      String(r.toUserId) === String(p.user_id) &&
      String(r.player?.player_id) === String(p.player_id) &&
      r.status === 'pending'
    );
    if (already) return alert('You already have a pending request to this player.');
    const ok = window.confirm(`Send request to ${p.display_name || p.user_id || p.player_id}?`);
    if (!ok) return;
    setPending(prev => ({ ...prev, [p.player_id]: 'pending' }));
    try {
      const reqId = String(Date.now()) + '-' + Math.random().toString(36).slice(2,8);
      const payload = { reqId, player_id: p.player_id, fromUserId: user.id, fromName: user.display_name || user.name || `User ${user.id}`, ts: Date.now(), player: p };
      if (p.user_id) {
        const key = `club_booking_request:${p.user_id}:${reqId}`;
        // include toName/toUserId in the index for easier enumeration
        const indexObj = { reqId, fromUserId: user.id, fromName: payload.fromName, toUserId: p.user_id, toName: p.display_name || null, player: p, ts: payload.ts };
        localStorage.setItem(key, JSON.stringify(payload));
        localStorage.setItem(`club_booking_request_index:${p.user_id}:${reqId}`, JSON.stringify(indexObj));
        // add to local requests state as outgoing
        setRequests(prev => [{ reqId, fromUserId: user.id, fromName: payload.fromName, toUserId: p.user_id, toName: p.display_name || null, player: p, ts: payload.ts, status: 'pending' }, ...prev]);
      }
    } catch (e) {}
  };

  // accept/decline handlers for incoming requests
  const acceptRequest = (r) => {
    try {
      setPending(prev => ({ ...prev, [r.player.player_id]: 'accepted' }));
      const respKey = `club_booking_response:${r.fromUserId}:${r.reqId}`;
      const payload = { reqId: r.reqId, player_id: r.player.player_id, status: 'accepted', fromUserId: (user && user.id) || null, fromName: (user && (user.display_name || user.name)) || null, toUserId: r.fromUserId };
      localStorage.setItem(respKey, JSON.stringify(payload));
      // also write a structured index so requester can reconcile later
      try { localStorage.setItem(`club_booking_response_index:${r.fromUserId}:${r.reqId}`, JSON.stringify(payload)); } catch (e) {}
      // update requests state
      setRequests(prev => prev.map(x => String(x.reqId) === String(r.reqId) ? { ...x, status: 'accepted' } : x));
    } catch (e) {}
  };

  const declineRequest = (r) => {
    try {
      setPending(prev => ({ ...prev, [r.player.player_id]: 'declined' }));
      const respKey = `club_booking_response:${r.fromUserId}:${r.reqId}`;
      const payload = { reqId: r.reqId, player_id: r.player.player_id, status: 'declined', fromUserId: (user && user.id) || null, fromName: (user && (user.display_name || user.name)) || null, toUserId: r.fromUserId };
      localStorage.setItem(respKey, JSON.stringify(payload));
      try { localStorage.setItem(`club_booking_response_index:${r.fromUserId}:${r.reqId}`, JSON.stringify(payload)); } catch (e) {}
      setRequests(prev => prev.map(x => String(x.reqId) === String(r.reqId) ? { ...x, status: 'declined' } : x));
    } catch (e) {}
  };

  // Cancel an outgoing pending request (called by requester)
  const cancelRequest = (r) => {
    try {
      // Remove the outgoing request so the sender can send again.
      // Do NOT mark it as 'declined' — treat cancel as removal of the request.
      setRequests(prev => prev.filter(x => String(x.reqId) !== String(r.reqId)));
      // clear pending flag for this player
      setPending(prev => {
        const copy = { ...prev };
        try { delete copy[r.player.player_id]; } catch (e) {}
        return copy;
      });
      // remove the message key and the index entry for the outgoing side so recipient won't see it as pending
      try { localStorage.removeItem(`club_booking_request:${r.toUserId}:${r.reqId}`); } catch(e){}
      try { localStorage.removeItem(`club_booking_request_index:${r.toUserId}:${r.reqId}`); } catch(e){}
      // write a lightweight cancellation response index so other tabs can reconcile if needed
      try {
        const respKey = `club_booking_response:${r.toUserId}:${r.reqId}`;
        const payload = { reqId: r.reqId, player_id: r.player.player_id, status: 'cancelled', fromUserId: (user && user.id) || null, fromName: (user && (user.display_name || user.name)) || null, toUserId: r.toUserId };
        localStorage.setItem(respKey, JSON.stringify(payload));
        localStorage.setItem(`club_booking_response_index:${r.toUserId}:${r.reqId}`, JSON.stringify(payload));
      } catch (e) {}
    } catch (e) {}
  };

  // Clear all requests initiated by the current user (outgoing)
  const clearMyRequests = () => {
    try {
      // Only remove past (non-pending) outgoing requests. Preserve pending ones.
      const mineToRemove = requests.filter(r => Number(r.fromUserId) === Number(user?.id) && String(r.status) !== 'pending');
      mineToRemove.forEach(r => {
        try { localStorage.removeItem(`club_booking_request:${r.toUserId}:${r.reqId}`); } catch (e) {}
        try { localStorage.removeItem(`club_booking_request_index:${r.toUserId}:${r.reqId}`); } catch (e) {}
      });
      setRequests(prev => prev.filter(r => !(Number(r.fromUserId) === Number(user?.id) && String(r.status) !== 'pending')));
    } catch (e) {}
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-[520px] max-w-[95%] bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Looking for partner</h3>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded bg-gray-200"
              onClick={async ()=>{
                if (!club) return;
                const hasServer = Boolean(API_BASE);
                if (!hasServer) {
                  // no backend configured — just reload local view
                  try { const keys = Object.keys(localStorage || {}).filter(k => k.startsWith(`club_booking_looking:${club.id}:`)); if (keys.length) { const rows = keys.map(k=>JSON.parse(localStorage.getItem(k))).filter(Boolean); setList(prev=>{ const map={}; rows.forEach(r=>map[String(r.userId)]= { player_id: r.player_id||`local-${r.userId}`, user_id: r.userId, display_name: r.display_name, looking_since: r.ts||Date.now()}); prev.forEach(r=>{ if(!map[String(r.user_id)]) map[String(r.user_id)] = r}); return Object.values(map); }); } } catch(e){}
                  return;
                }
                try {
                  const r = await fetch(`${API_BASE}/clubs/${club.id}/looking`, { credentials: 'include' });
                  const d = await r.json().catch(()=>null);
                  if (r.ok && Array.isArray(d)) setList(d);
                } catch (e) {
                  // ignore network errors
                }
              }}
            >
              Refresh
            </button>
            <button className="px-3 py-1 rounded bg-gray-100" onClick={onClose}>Close</button>
            {user && (
              <>
                <button className="px-3 py-1 rounded bg-red-50 text-red-700" onClick={()=>setShowClearConfirm(true)}>Clear my requests</button>
                {showClearConfirm && (
                  <div className="fixed inset-0 z-60 grid place-items-center bg-black/40">
                    <div className="w-[360px] bg-white rounded-xl shadow p-4">
                      <div className="text-lg font-medium mb-2">Clear all requests?</div>
                      <div className="text-sm text-gray-600 mb-4">Are you sure you want to clear all your requests?</div>
                      <div className="flex justify-end gap-2">
                        <button className="px-3 py-1 rounded bg-gray-100" onClick={()=>setShowClearConfirm(false)}>Cancel</button>
                        <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={()=>{ setShowClearConfirm(false); clearMyRequests(); }}>Clear</button>
                      </div>
                    </div>
                  </div>
                )}
                {showTimeModal && (
                  <div className="fixed inset-0 z-60 grid place-items-center bg-black/40">
                    <div className="w-[420px] bg-white rounded-xl shadow p-4">
                      <div className="text-lg font-medium mb-2">When are you looking?</div>
                      <div className="text-sm text-gray-600 mb-3">Optional — pick a time window you'd like to play (local time).</div>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div>
                          <label className="text-xs text-gray-600">From</label>
                          <input type="datetime-local" value={requestedFrom} onChange={(e)=>setRequestedFrom(e.target.value)} className="w-full border rounded px-2 py-1" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">To</label>
                          <input type="datetime-local" value={requestedTo} onChange={(e)=>setRequestedTo(e.target.value)} className="w-full border rounded px-2 py-1" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button className="px-3 py-1 rounded bg-gray-100" onClick={()=>{ setShowTimeModal(false); setRequestedFrom(''); setRequestedTo(''); }}>Cancel</button>
                        <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={()=>{
                          // Confirm: enable looking with optional requested_from/to
                          setShowTimeModal(false);
                          try {
                            // convert inputs (like '2025-10-02T10:00') to ISO strings
                            let rfIso = null, rtIso = null;
                            if (requestedFrom) {
                              const d1 = new Date(requestedFrom);
                              if (!Number.isNaN(d1.getTime())) rfIso = d1.toISOString();
                            }
                            if (requestedTo) {
                              const d2 = new Date(requestedTo);
                              if (!Number.isNaN(d2.getTime())) rtIso = d2.toISOString();
                            }
                            // Only use a range when both are present and valid
                            if (rfIso && rtIso && (new Date(rtIso).getTime() >= new Date(rfIso).getTime())) {
                              toggleMyLooking({ requested_from: rfIso, requested_to: rtIso });
                            } else {
                              // no valid range -> just toggle without times (anytime)
                              toggleMyLooking();
                            }
                          } catch (e) { toggleMyLooking(); }
                        }}>Confirm</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mb-3">
            <div className="flex items-center gap-3 justify-between">
            <span className="text-sm text-gray-600">Open the list and request to hit other players.</span>
            <div>
                {/* server usage is automatic when VITE_API_BASE is set; no manual toggle */}
                <button onClick={onClickLookingButton} className={`px-3 py-1 rounded ${isMeLooking ? 'bg-red-100 text-red-700' : 'bg-green-500 text-white'}`}>
                  {isMeLooking ? 'Stop looking' : 'I am looking'}
                </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-700 mb-2">Players currently looking</div>
            <div className="space-y-2 max-h-[50vh] overflow-auto">
              {list.length === 0 && <div className="text-sm text-gray-500">No players currently looking.</div>}
              {list.map(p => (
                <div key={p.player_id} className="flex items-center justify-between border rounded p-2">
                    <div className="flex items-center gap-3">
                    <div className="text-sm">{p.display_name || `User ${p.user_id || p.player_id}`}</div>
                    <div className="flex flex-col text-xs text-gray-500">
                      {(() => {
                        const formatted = getPlayerRange(p);
                        if (formatted) return <span>looking for: {formatted}</span>;
                        return <span>looking for: anytime</span>;
                      })()}
                    </div>
                  </div>
                  <div>
                    {user && p.user_id && Number(p.user_id) === Number(user.id) ? (
                      <span className="text-xs italic text-gray-500">You</span>
                      ) : (
                      <div className="flex items-center gap-2">
                        {pending[p.player_id] === 'pending' ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Pending...</span>
                            <button onClick={()=>{
                              // find the outgoing request to this user/player
                              const outgoing = requests.find(r => Number(r.toUserId) === Number(p.user_id) && r.status === 'pending');
                              if (outgoing) cancelRequest(outgoing);
                            }} className="text-xs text-red-600 underline">Cancel</button>
                          </div>
                        ) : pending[p.player_id] === 'accepted' ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">Accepted</span>
                        ) : pending[p.player_id] === 'declined' ? (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">Declined</span>
                        ) : (
                          <>
                            <button onClick={()=>sendRequest(p)} className="px-3 py-1 text-sm rounded bg-black text-white hover:opacity-90">Request to Hit</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
              <div className="text-sm text-gray-700 mb-2">Requests</div>
              <div className="space-y-2 max-h-[50vh] overflow-auto">
                {requests.length === 0 && <div className="text-sm text-gray-500">No requests yet.</div>}
                {requests.map(r => (
                  <div key={r.reqId} className="flex items-center justify-between border rounded p-2">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium">{r.fromUserId === (user && user.id) ? `You -> ${r.toName || `User ${r.toUserId}`}` : `${r.fromName || `User ${r.fromUserId}`} -> ${r.toName || (r.toUserId ? `User ${r.toUserId}` : 'Unknown')}`}</div>
                      <div className="text-xs text-gray-500">Player: {r.player?.display_name || `Player ${r.player?.player_id}`}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === 'pending' && Number(r.toUserId) === Number(user?.id) ? (
                        <>
                          <button onClick={()=>acceptRequest(r)} className="px-3 py-1 rounded bg-green-500 text-white">Accept</button>
                          <button onClick={()=>declineRequest(r)} className="px-3 py-1 rounded bg-red-100 text-red-700">Decline</button>
                        </>
                      ) : r.status === 'pending' && Number(r.fromUserId) === Number(user?.id) ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Pending…</span>
                      ) : r.status === 'accepted' ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">{Number(r.fromUserId) === Number(user?.id) ? `${r.toName || `User ${r.toUserId}`} accepted` : `${r.fromName} accepted`}</span>
                      ) : r.status === 'declined' ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">{Number(r.fromUserId) === Number(user?.id) ? `${r.toName || `User ${r.toUserId}`} declined` : `${r.fromName} declined`}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
          </div>
        </div>

        {/* simulated recipient UI removed - requests are handled in the unified list */}

      </div>
    </div>
  );
}
