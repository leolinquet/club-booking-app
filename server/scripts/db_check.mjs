import 'dotenv/config';
import { pool } from '../db.js';

(async ()=>{
  try {
    const r1 = await pool.query('select current_database() as db, current_user as usr');
    console.log('db identity:', r1.rows[0]);
    const ver = (await pool.query('select version()')).rows?.[0]?.version || '';
    console.log('version:', ver.split('\n')[0]);

    const courts = (await pool.query('SELECT id, club_id, label FROM courts ORDER BY id LIMIT 50')).rows;
    console.log('courts rows (first 50):', courts.length);
    console.log(courts.slice(0,50));

    const cnt = (await pool.query('SELECT COUNT(*)::int AS c FROM courts WHERE club_id=$1',[9])).rows[0];
    console.log('courts count for club 9:', cnt.c);
  } catch (e) {
    console.error('db check error', e && e.message ? e.message : e);
  } finally {
    await pool.end();
  }
})();
