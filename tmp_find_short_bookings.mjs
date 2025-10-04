import 'dotenv/config';
import { pool } from './server/db.js';

(async function(){
  try {
    const q = `SELECT id, user_id, club_id, starts_at, ends_at, (ends_at - starts_at) AS dur FROM bookings WHERE ends_at IS NOT NULL AND (ends_at - starts_at) <= interval '00:10:00' ORDER BY starts_at DESC LIMIT 50`;
    const { rows } = await pool.query(q);
    console.log('short bookings:', rows);
  } catch (e) {
    console.error('err', e && e.stack ? e.stack : e);
  } finally {
    await pool.end();
  }
})();
