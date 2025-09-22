import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, one } from '../db.js';
import { tableInfo } from '../pg_compat.js';

async function main() {
  try {
    const managerUsername = 'leolinquet';
    const managerPassword = '1234';

    // Check existing user
    const existing = (await pool.query('SELECT id FROM users WHERE LOWER(username)=LOWER($1) LIMIT 1', [managerUsername])).rows[0];
    if (existing) {
      console.log('Manager account already exists with id:', existing.id);
      process.exit(0);
    }

    const password_hash = await bcrypt.hash(managerPassword, 10);

    const uInfo = await tableInfo('users');
    const uCols = (uInfo || []).map(c => ({ name: c.name, notnull: !!c.notnull }));
    const insertCols = [];
    const insertVals = [];

    // Helper to push a column/value
    const push = (col, val) => { insertCols.push(col); insertVals.push(val); };

    // Prefer to populate common columns and ensure NOT NULL constraints are satisfied
    const find = name => uCols.find(c => c.name === name);
    if (find('display_name')) push('display_name', managerUsername);
    if (find('username')) push('username', managerUsername);
    if (find('password_hash')) push('password_hash', password_hash);
    if (find('role')) push('role', 'manager');
    if (find('is_manager')) push('is_manager', true);
    if (find('email')) {
      // If email is required, create a plausible placeholder
      push('email', `${managerUsername}@example.local`);
    }
    if (find('email_verified_at')) push('email_verified_at', new Date().toISOString());

    // For any NOT NULL column we didn't explicitly set, try to set a conservative default
    for (const c of uCols) {
      if (c.notnull && !insertCols.includes(c.name)) {
        // Skip auto-generated primary key
        if (c.name === 'id') continue;
        if (c.name === 'created_at' || c.name === 'created') continue;
        // Use a small set of smart defaults depending on column name/type
        if (c.name.includes('email')) { push(c.name, `${managerUsername}@example.local`); }
        else if (c.name.includes('name') || c.name.includes('username') || c.name.includes('display')) { push(c.name, managerUsername); }
        else if (c.name.includes('role')) { push(c.name, 'manager'); }
        else if (c.name.includes('is_') || c.name === 'is_manager') { push(c.name, true); }
        else if (c.name.includes('count') || c.name.endsWith('_id')) { push(c.name, 0); }
        else {
          // default to string fallback
          push(c.name, managerUsername);
        }
      }
    }

    if (!insertCols.length) {
      console.warn('No compatible users columns found to create manager account. Skipping creation.');
      process.exit(1);
    }

    const placeholders = insertVals.map((_, i) => `$${i+1}`).join(', ');
    const sql = `INSERT INTO users (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING id`;
    const res = await pool.query(sql, insertVals);
    console.log('Created manager account:', managerUsername, 'id=', res.rows[0].id);
    process.exit(0);
  } catch (e) {
    console.error('create_manager failed:', e && e.message ? e.message : e);
    process.exit(2);
  }
}

main();
