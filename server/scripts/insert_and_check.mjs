import 'dotenv/config';
import { pool } from '../db.js';

(async ()=>{
  try {
    const clubId = 9;
    const courtId = (await pool.query('SELECT id FROM courts WHERE club_id=$1 ORDER BY id ASC LIMIT 1',[clubId])).rows?.[0]?.id;
    console.log('using courtId', courtId);
    const targetUserId = 8;
    const start = new Date('2025-09-20T14:00:00Z');
    const end = new Date(start.getTime() + 60*60*1000);
    const startsAtISO = start.toISOString();
    const endsAtISO = end.toISOString();

    const ins = await pool.query('INSERT INTO bookings (club_id, court_id, starts_at, ends_at, user_id) VALUES ($1,$2,$3,$4,$5) RETURNING id',[clubId, courtId, startsAtISO, endsAtISO, targetUserId]);
    console.log('insert returned', ins.rows[0]);

    const rows = (await pool.query('SELECT id, club_id, court_id, user_id, starts_at AT TIME ZONE \"UTC\" AS starts_utc FROM bookings WHERE club_id=$1 ORDER BY id',[clubId])).rows;
    console.log('bookings rows for club', clubId, rows);

  } catch (e) {
    console.error('err', e && e.message ? e.message : e);
  } finally {
    await pool.end();
  }
})();
