// server/pg_introspect.js
import { q } from './db.js';

export async function colSet(table) {
  const { rows } = await q(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  return new Set(rows.map(r => r.column_name));
}
