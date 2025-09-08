// server/db.js
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon/Render friendly
});

export async function q(sql, params = []) {
  return pool.query(sql, params);
}

// Return rows for any query; special-case PRAGMA table_info(...)
export async function all(sql, params = []) {
  const text = String(sql).trim();

  // SQLite -> Postgres shim
  const m = text.match(/^PRAGMA\s+table_info\(([^)]+)\)/i);
  if (m) {
    const table = m[1].replace(/["']/g, '');
    const { rows } = await q(
      `SELECT column_name AS name, data_type AS type
         FROM information_schema.columns
        WHERE table_schema='public' AND table_name = $1
        ORDER BY ordinal_position`,
      [table]
    );
    return rows; // shape: [{ name, type }, ...]
  }

  const { rows } = await q(text, Array.isArray(params) ? params : []);
  return rows;
}

export async function one(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] ?? null;
}
