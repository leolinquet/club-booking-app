#!/usr/bin/env node
import 'dotenv/config';
import { pool } from '../db.js';
import { tableInfo } from '../pg_compat.js';

async function main() {
  try {
    const id = 1;
    await pool.query('SELECT 1');

    const cols = (await tableInfo('users')).map(c => c.name);
    const selectCols = ['id'];
    if (cols.includes('display_name')) selectCols.push('display_name');
    if (cols.includes('username')) selectCols.push('username');
    if (cols.includes('email')) selectCols.push('email');
    if (cols.includes('password_hash')) selectCols.push('password_hash');
    if (cols.includes('role')) selectCols.push('role');
    if (cols.includes('is_manager')) selectCols.push('is_manager');
    if (cols.includes('email_verified_at')) selectCols.push('email_verified_at');

    const q = `SELECT ${selectCols.join(', ')} FROM users WHERE id = $1`;
    const res = await pool.query(q, [id]);
    if (!res.rows || res.rows.length === 0) {
      console.error('No user found with id', id);
      process.exit(2);
    }
    const u = res.rows[0];
    const out = { id: u.id };
    if ('display_name' in u) out.display_name = u.display_name;
    if ('username' in u) out.username = u.username;
    if ('email' in u) out.email = u.email;
    if ('password_hash' in u) {
      const ph = u.password_hash ? String(u.password_hash) : null;
      out.password_hash_redacted = ph ? (ph.length > 12 ? ph.slice(0,6) + '…' + ph.slice(-6) : 'REDACTED') : null;
    }
    if ('role' in u) out.role = u.role;
    if ('is_manager' in u) out.is_manager = !!u.is_manager;
    if ('email_verified_at' in u) out.email_verified_at = u.email_verified_at;

    console.log(JSON.stringify(out, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('inspect_user_remote error:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
