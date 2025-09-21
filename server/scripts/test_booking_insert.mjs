import 'dotenv/config';
import { pool } from '../db.js';

(async function(){
  try {
    const clubId = 9;
    const courtIndex = 0;
    const date = '2025-09-20';
    const time = '10:00';
    const userId = 6;

    // find court id
    const courtRow = (await pool.query('SELECT id FROM courts WHERE club_id=$1 ORDER BY id ASC LIMIT 1 OFFSET $2', [clubId, courtIndex])).rows[0];
    let courtId;
    if (courtRow && courtRow.id != null) {
      courtId = Number(courtRow.id);
    } else {
      console.error('No courts found for club', clubId, 'with offset', courtIndex, '\nPlease create courts for this club before running this test.');
      process.exit(2);
    }

    const startsAt = `${String(date)} ${String(time)}`;
    const startDt = new Date(`${String(date)}T${String(time)}:00Z`);
    const endDt = new Date(startDt.getTime() + 60*60*1000);
    const startsAtISO = startDt.toISOString();
    const endsAtISO = endDt.toISOString();

    console.log('courtId:', courtId);
    console.log('startsAt:', startsAtISO);
    console.log('endsAt:', endsAtISO);

    const sql = `INSERT INTO bookings (club_id, court_id, starts_at, ends_at, user_id) VALUES ($1,$2,$3,$4,$5) RETURNING id`;
    const params = [clubId, courtId, startsAtISO, endsAtISO, userId];
    console.log('SQL:', sql);
    console.log('params:', params);

    try {
      const r = await pool.query(sql, params);
      console.log('insert ok:', r.rows[0]);
    } catch (e) {
      console.error('insert error:', e.code, e.message, e.detail);
    }
  } catch (e) {
    console.error('script error', e);
  } finally {
    await pool.end();
  }
})();
