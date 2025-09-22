import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const API = 'http://localhost:5051';

(async ()=>{
  try {
    const client = await pool.connect();
    await client.query('BEGIN');
    // create club
    const name = 'UTC-E2E-' + Date.now();
  const clubRes = await client.query("INSERT INTO clubs (name, sport, manager_id, code, timezone) VALUES ($1,'tennis',$2,NULL,$3) RETURNING id", [name, 4, 'UTC']);
    const clubId = clubRes.rows[0].id;
    console.log('created club', clubId, name);
  // create a court
    const courtRes = await client.query('INSERT INTO courts (club_id, label, sport) VALUES ($1,$2,$3) RETURNING id',[clubId,'Court 1','tennis']);
    const courtId = courtRes.rows[0].id;
    console.log('created court', courtId);
  // Ensure club_sports exists for 'tennis'
  await client.query("INSERT INTO club_sports (club_id, sport, courts, open_hour, close_hour, slot_minutes) VALUES ($1,'tennis',1,8,22,60) ON CONFLICT (club_id, sport) DO NOTHING",[clubId]);
    // insert booking at 2000-01-01T08:00:00Z
    const starts = '2000-01-01T08:00:00.000Z';
    const ends = '2000-01-01T09:00:00.000Z';
    await client.query('INSERT INTO bookings (club_id, court_id, starts_at, ends_at, user_id) VALUES ($1,$2,$3,$4,$5)',[clubId,courtId,starts,ends,4]);
    await client.query('COMMIT');

  console.log('Inserted legacy booking with starts_at', starts);
  // inspect DB row
  const dbg = await client.query('SELECT id, club_id, court_id, starts_at FROM bookings WHERE club_id=$1', [clubId]);
  console.log('db bookings for club:', dbg.rows);
  // call availability endpoint
    const date = '2000-01-01';
    const url = `${API}/availability?clubId=${clubId}&sport=tennis&date=${date}&userId=4`;
    console.log('fetching',url);
    const r = await fetch(url);
    const data = await r.json();
    console.log('status', r.status);
    console.log(JSON.stringify(data.slots.slice(0,5), null, 2));

  // NOTE: do not delete the club here so we can inspect results; release client
  await client.release();
  } catch (e) {
    console.error('e2e failed', e);
    try { await pool.query('ROLLBACK'); } catch{};
  } finally {
    await pool.end();
  }
})();
