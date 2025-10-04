import 'dotenv/config';
import { pool } from '../db.js';

// This test queries the DB for a scenario: find bookings for a given user and
// print whether any booking's computed end_at > NOW(). Update userId/clubId
// below to match your test case.

const userId = Number(process.env.TEST_USER_ID || 1);
const clubId = Number(process.env.TEST_CLUB_ID || 1);

async function main(){
  try {
    const { rows } = await pool.query(`
      SELECT id, user_id, club_id, date, time,
        (to_timestamp(date || ' ' || time, 'YYYY-MM-DD HH24:MI') + interval '1 minute' * coalesce((SELECT slot_minutes FROM club_sports WHERE club_id = bookings.club_id LIMIT 1), 60)) AS end_at
      FROM bookings
      WHERE user_id = $1 AND club_id = $2
      ORDER BY end_at DESC LIMIT 20
    `, [userId, clubId]);
    console.log('Now:', (await pool.query('SELECT NOW() AS now')).rows[0].now);
    console.log('Rows:', rows);
    const hasActive = rows.some(r => r.end_at && r.end_at > (new Date()));
    console.log('hasActive:', hasActive);
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
  } finally {
    await pool.end();
  }
}

main();
