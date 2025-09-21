#!/usr/bin/env node
// Simple smoke test for key API endpoints (no external deps)
const BASE = process.env.BASE || 'http://127.0.0.1:5051';

async function safeJson(res){ try { return await res.json(); } catch { return null; } }

async function run(){
  console.log('BASE =', BASE);

  if (typeof fetch !== 'function') {
    console.error('global fetch is not available in this Node; please run with Node 18+ or set up node-fetch.');
    process.exit(1);
  }

  // 1) signup
  // generate a collision-resistant email
  const uid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}_${process.pid}`;
  let email = `smoke_${uid}@example.test`;
  let res, s;
  // attempt signup with a few retries if email collides
  for (let attempt = 0; attempt < 5; attempt++) {
    const displayName = `Smoke_${uid}_${attempt || 0}`;
    res = await fetch(`${BASE}/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Sm0keTest!', name: displayName })
    });
    s = await safeJson(res);
    console.log('signup attempt', attempt + 1, res.status, s);
    if (res.status === 201) break;
    // collision or conflict -> try a new email
    email = `smoke_${uid}_${attempt}_${Date.now()}@example.test`;
    await new Promise(r => setTimeout(r, 120));
  }
  if (!res || res.status !== 201) return process.exit(2);
  const userId = s.user?.id;

  // 2) create club
  res = await fetch(`${BASE}/clubs`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Smoke Club', managerId: userId })
  });
  const c = await safeJson(res);
  console.log('create club:', res.status, c);
  if (!res.ok) return process.exit(3);
  const clubId = c.id;

  // 3) create tournament
  res = await fetch(`${BASE}/clubs/${clubId}/tournaments`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Smoke Open', sport: 'tennis', drawSize: 8, seedCount: 2, managerId: userId })
  });
  const t = await safeJson(res);
  console.log('create tournament:', res.status, t);
  if (!res.ok) return process.exit(4);

  console.log('\nSmoke test passed');
}

run().catch(e => { console.error('smoke error', e); process.exit(1); });
