// server/check_seed.mjs
import { q, pool } from './db.js';
const club = await q("SELECT id, name FROM clubs ORDER BY id LIMIT 1");
const courts = await q("SELECT COUNT(*) FROM courts");
console.log('club:', club.rows[0]);
console.log('courts:', courts.rows[0]);
await pool.end();
