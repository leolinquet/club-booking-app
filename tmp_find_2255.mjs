import 'dotenv/config';
import db from './server/db.js';

(async ()=>{
  try {
    const q = `SELECT id, user_id, club_id, court_id, starts_at, ends_at
      FROM bookings
      WHERE to_char(starts_at, 'HH24:MI') = '22:55'
      ORDER BY starts_at DESC`;
    const rows = await db.prepare(q).all();
    console.log('rows matching 22:55:', rows);
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
  } finally {
    process.exit(0);
  }
})();
