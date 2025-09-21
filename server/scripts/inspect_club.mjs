import 'dotenv/config';
import { pool } from '../db.js';

(async ()=>{
  try {
    const clubId = 9;
    console.log('Club:', clubId);
    const club = (await pool.query('SELECT id, name, manager_id FROM clubs WHERE id=$1', [clubId])).rows[0];
    console.log('club row:', club);

    const users = (await pool.query('SELECT id, username, display_name, email FROM users ORDER BY id ASC LIMIT 10')).rows;
    console.log('users (first 10):', users);

    const courts = (await pool.query('SELECT id, club_id, name FROM courts WHERE club_id=$1 ORDER BY id ASC', [clubId])).rows;
    console.log('courts for club:', courts);
  } catch (e) {
    console.error('inspect error', e && e.message ? e.message : e);
  } finally {
    await pool.end();
  }
})();
