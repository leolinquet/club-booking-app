import { q, pool } from './db.js';

const r = await q(
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1"
);
console.log(r.rows);
await pool.end();
