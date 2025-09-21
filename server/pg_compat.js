// server/pg_compat.js
import { pool } from './db.js';

export async function tableInfo(table) {
  // Return a compat shape similar to `db.tableInfo()` used elsewhere:
  // [{ name, data_type, is_nullable, column_default, notnull }, ...]
  const { rows } = await pool.query(
    `SELECT column_name AS name, data_type, is_nullable, column_default,
            (is_nullable='NO')::int AS notnull
       FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1
      ORDER BY ordinal_position`,
    [table]
  );
  return rows;
}

export async function addColumnsIfMissing(table, cols) {
  let defs = [];
  if (Array.isArray(cols)) {
    defs = cols.map(def => {
      const name = def.trim().split(/\s+/)[0].replace(/["']/g, '');
      return { name, def };
    });
  } else if (cols && typeof cols === 'object') {
    defs = Object.entries(cols).map(([name, def]) => ({ name, def }));
  } else {
    return;
  }

  // Basic validation: table and column names must be simple identifiers
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(String(table))) {
    throw new Error(`invalid table name: ${table}`);
  }

  const { rows } = await pool.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  const existing = new Set(rows.map(r => r.column_name));

  for (const { name, def } of defs) {
    // def originally looks like: "col_name TYPE DEFAULT ..."
    // normalize and split into identifier + rest
    const m = String(def).trim().match(/^"?([A-Za-z_][A-Za-z0-9_]*)"?\s+([\s\S]+)$/);
    if (!m) continue;
    const colName = m[1];
    let rest = m[2].trim();
    // refuse dangerous tokens or statement terminators
    if (/[;]|--|\bDROP\b|\bTRUNCATE\b|\bALTER\b/i.test(rest)) {
      throw new Error(`refusing to add unsafe column definition for ${colName}`);
    }

    if (!existing.has(colName)) {
      // quote identifiers to be safe
      await pool.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${colName}" ${rest}`);
      existing.add(colName);
    }
  }
}
