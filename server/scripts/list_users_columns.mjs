#!/usr/bin/env node
import 'dotenv/config';
import { tableInfo } from '../pg_compat.js';
import { pool } from '../db.js';

async function main() {
  try {
    await pool.query('SELECT 1');
    const info = await tableInfo('users');
    console.log(JSON.stringify(info.map(c=>c.name), null, 2));
    process.exit(0);
  } catch (e) {
    console.error('list_users_columns error:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();
