// server/pg_compat.js
import { pool } from './db.js';

export async function tableInfo(table) {
  const { rows } = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1
      ORDER BY ordinal_position`,
    [table]
  );
  // Normalize shape to { name, data_type, is_nullable, column_default, notnull }
  return rows.map(r => ({
    name: r.column_name,
    data_type: r.data_type,
    is_nullable: r.is_nullable,
    column_default: r.column_default,
    notnull: r.is_nullable === 'NO' ? 1 : 0
  }));
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

  const { rows } = await pool.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  const existing = new Set(rows.map(r => r.column_name));

  for (const { name, def } of defs) {
    if (!existing.has(name)) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${def}`);
      existing.add(name);
    }
  }
}
