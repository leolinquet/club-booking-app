// server/pg_introspect.js
import { q } from './db.js';

/**
 * Return an array of columns for a table in the public schema.
 * [{ name, data_type, is_nullable }, ...]
 */
export async function tableInfo(table) {
  const rows = await q(
    `
    SELECT
      column_name  AS name,
      data_type    AS data_type,
      is_nullable  AS is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
    `,
    table
  );
  // Guarantee an array
  return Array.isArray(rows) ? rows : [];
}

/** Return a Set of column names for quick membership checks. */
export async function colSet(table) {
  const rows = await tableInfo(table);        // always an array
  return new Set(rows.map(r => r.name));      // Set<string>
}

/** Does a table exist in the public schema? */
export async function tableExists(table) {
  const rows = await q(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists
    `,
    table
  );
  return !!rows?.[0]?.exists;
}
