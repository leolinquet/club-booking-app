#!/usr/bin/env node
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { tableInfo } from '../pg_compat.js';

async function main() {
  try {
    const username = 'leolinquet';
    const password = '1234';

    // Ensure DB reachable
    await pool.query('SELECT 1');

    // Inspect available columns to build compatible INSERT and detect a lookup column
    const cols = (await tableInfo('users')).map(c => c.name);

    // Choose a column to look up existing user by (preference order)
    const lookupCandidates = ['username', 'display_name', 'name', 'email'];
    const lookupCol = lookupCandidates.find(c => cols.includes(c));
    if (lookupCol) {
      const q = `SELECT id FROM users WHERE LOWER(${lookupCol}) = LOWER($1) LIMIT 1`;
      const { rows } = await pool.query(q, [username]);
      if (rows && rows.length) {
        console.log('Manager user already exists with id:', rows[0].id);
        process.exit(0);
      }
    } else {
      console.warn('No lookup column found on users table; proceeding to insert without existence check');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

  // (cols already fetched above) build compatible INSERT
    const insertCols = [];
    const insertVals = [];

    if (cols.includes('display_name')) { insertCols.push('display_name'); insertVals.push(username); }
    if (cols.includes('username'))     { insertCols.push('username'); insertVals.push(username); }
    if (cols.includes('password_hash')){ insertCols.push('password_hash'); insertVals.push(password_hash); }
    if (cols.includes('role'))         { insertCols.push('role'); insertVals.push('manager'); }
    if (cols.includes('is_manager'))   { insertCols.push('is_manager'); insertVals.push(true); }
    if (cols.includes('email_verified_at')) { insertCols.push('email_verified_at'); insertVals.push(new Date().toISOString()); }

    if (!insertCols.length) {
      console.error('No compatible users columns found; aborting.');
      process.exit(2);
    }

    const placeholders = insertVals.map((_, i) => `$${i+1}`).join(', ');
    const sql = `INSERT INTO users (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING id`;
    const res = await pool.query(sql, insertVals);
    if (res.rows && res.rows[0] && res.rows[0].id) {
      console.log('Created manager user:', username, 'id:', res.rows[0].id);
      process.exit(0);
    }

    console.error('Failed to create manager user for unknown reason.');
    process.exit(3);
  } catch (e) {
    console.error('Error creating manager user:', e && e.message ? e.message : e);
    process.exit(4);
  }
}

main();
