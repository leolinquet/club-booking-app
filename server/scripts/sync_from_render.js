#!/usr/bin/env node
/**
 * Sync data from Render/Neon database to local database
 * Use this to copy production data to local for development/testing
 * 
 * Usage:
 *   RENDER_DATABASE_URL='postgres://...' node scripts/sync_from_render.js
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { RENDER_DATABASE_URL, DATABASE_URL } = process.env;

if (!RENDER_DATABASE_URL) {
  console.error('❌ Usage: RENDER_DATABASE_URL="postgres://..." node scripts/sync_from_render.js');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

const renderPool = new Pool({
  connectionString: RENDER_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const localPool = new Pool({
  connectionString: DATABASE_URL
});

async function syncData() {
  console.log('🔄 Syncing data from Render to local database...');
  
  try {
    // Example: Sync users table
    console.log('📥 Syncing users...');
    const { rows: users } = await renderPool.query('SELECT * FROM users ORDER BY id');
    
    for (const user of users) {
      await localPool.query(`
        INSERT INTO users (id, username, email, display_name, role, is_manager, created_at, email_verified_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          role = EXCLUDED.role,
          is_manager = EXCLUDED.is_manager
      `, [user.id, user.username, user.email, user.display_name, user.role, user.is_manager, user.created_at, user.email_verified_at]);
    }
    
    console.log(`✅ Synced ${users.length} users`);
    
    // Add more tables as needed...
    // clubs, tournaments, etc.
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await syncData();
    console.log('✅ Sync completed successfully');
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  } finally {
    await renderPool.end();
    await localPool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}