#!/usr/bin/env node
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';

async function main() {
  const username = process.env.MANAGER_USERNAME || 'leolinquet';
  const password = process.env.MANAGER_PASSWORD || '1234';
  const email = process.env.MANAGER_EMAIL || `${username}@example.local`;

  try {
    await pool.query('SELECT 1');

    // Check by username/display_name/email (case-insensitive)
    const q = `SELECT id FROM users WHERE LOWER(display_name)=LOWER($1) OR LOWER(username)=LOWER($1) OR LOWER(email)=LOWER($2) LIMIT 1`;
    const existing = await pool.query(q, [username, email]);
    if (existing.rows && existing.rows.length) {
      console.log('Manager user already exists with id:', existing.rows[0].id);
      process.exit(0);
    }

    const password_hash = await bcrypt.hash(password, 10);

    const res = await pool.query(
      `INSERT INTO users (display_name, username, email, password_hash, role, is_manager, email_verified_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING id`,
      [username, username, email, password_hash, 'manager', true]
    );

    if (res.rows && res.rows[0]) {
      console.log('Created manager user:', username, 'id:', res.rows[0].id);
      process.exit(0);
    }

    console.error('Failed to create manager user');
    process.exit(1);
  } catch (e) {
    console.error('Error creating manager user:', e && e.message ? e.message : e);
    process.exit(2);
  }
}

main();
