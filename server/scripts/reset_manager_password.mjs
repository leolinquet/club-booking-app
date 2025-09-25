#!/usr/bin/env node
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';

async function main() {
  try {
    const id = 1;
    const newPassword = '1234';
    // Ensure DB reachable
    await pool.query('SELECT 1');

    const hash = await bcrypt.hash(newPassword, 10);
    const res = await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id', [hash, id]);
    if (res.rows && res.rows[0] && res.rows[0].id) {
      console.log('Password updated for user id:', res.rows[0].id);
      process.exit(0);
    }
    console.error('Failed to update password; no rows returned');
    process.exit(2);
  } catch (e) {
    console.error('reset_manager_password error:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
