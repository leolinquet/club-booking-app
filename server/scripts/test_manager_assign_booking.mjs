import 'dotenv/config';
import { pool } from '../db.js';

(async ()=>{
  try {
    const clubId = 9;
    const sport = 'tennis';
    const courtIndex = 0;
    const date = '2025-09-20';
    const time = '10:00';
    const managerId = 6; // manager user
    const asUsername = 'user2'; // target username to assign booking to

    console.log('Looking up manager and target user');
    const club = (await pool.query('SELECT manager_id FROM clubs WHERE id=$1', [clubId])).rows[0];
    console.log('club manager_id', club && club.manager_id);

    const u = (await pool.query('SELECT id FROM users WHERE username=$1', [asUsername])).rows[0];
    if (!u) { console.error('target user not found'); process.exit(2); }
    const targetUserId = Number(u.id);
    console.log('targetUserId', targetUserId);

    // check active booking for target
    const now = new Date();
    const curDate = now.toISOString().slice(0,10);
    const curTime = `${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}`;

    const hasActive = (await pool.query(`SELECT 1 FROM bookings WHERE user_id=$1 AND (starts_at >= now()) LIMIT 1`, [targetUserId])).rows[0];
    console.log('hasActive for target:', !!hasActive);

    // map courtIndex -> court id for club
    const courtRow = (await pool.query('SELECT id FROM courts WHERE club_id=$1 ORDER BY id ASC LIMIT 1 OFFSET $2', [clubId, courtIndex])).rows[0];
    if (!courtRow) { console.error('No courts for club'); process.exit(2); }
    const courtId = Number(courtRow.id);
    console.log('mapped courtId', courtId);

    const startDt = new Date(`${date}T${time}:00Z`);
    const endDt = new Date(startDt.getTime() + 60*60*1000);
    const startsAtISO = startDt.toISOString();
    const endsAtISO = endDt.toISOString();

    console.log('Attempting insert with params', { clubId, courtId, startsAtISO, endsAtISO, targetUserId });
    const sql = `INSERT INTO bookings (club_id, court_id, starts_at, ends_at, user_id) VALUES ($1,$2,$3,$4,$5) RETURNING id`;
    try {
      const res = await pool.query(sql, [clubId, courtId, startsAtISO, endsAtISO, targetUserId]);
      console.log('inserted booking id', res.rows[0].id);
    } catch (e) {
      console.error('insert error', e.code, e.message, e.detail);
    }
  } catch (e) {
    console.error('script error', e && e.message ? e.message : e);
  } finally {
    await pool.end();
  }
})();
