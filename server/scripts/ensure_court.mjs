import 'dotenv/config';
import { pool } from '../db.js';

(async ()=>{
  try {
    const clubId = 9;
    const exists = (await pool.query('SELECT id FROM courts WHERE club_id=$1 ORDER BY id ASC LIMIT 1', [clubId])).rows[0];
    if (exists) {
      console.log('Court already exists for club', clubId, 'id=', exists.id);
      return;
    }
    const r = await pool.query('INSERT INTO courts (club_id,label) VALUES ($1,$2) RETURNING id', [clubId, 'Court 1']);
    console.log('Inserted court id', r.rows[0].id, 'for club', clubId);
  } catch (e) {
    console.error('ensure_court error', e && e.message ? e.message : e);
  } finally {
    await pool.end();
  }
})();
