#!/usr/bin/env node
/**
 * Script to ensure announcements tables exist on the target database.
 * Run this on Render or any environment where announcements are returning 404s.
 * 
 * Usage:
 *   node scripts/ensure_announcements_tables.js
 *   
 * or with explicit DATABASE_URL:
 *   DATABASE_URL=postgres://... node scripts/ensure_announcements_tables.js
 */

import { pool } from '../db.js';

async function ensureAnnouncementsTables() {
  console.log('Ensuring announcements tables exist...');
  
  try {
    // Execute the announcements migration SQL
    await pool.query(`
      BEGIN;

      -- Announcements created by club managers
      CREATE TABLE IF NOT EXISTS announcements (
        id BIGSERIAL PRIMARY KEY,
        club_id BIGINT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
        manager_id BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        send_push BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Per-user delivery/read tracking
      CREATE TABLE IF NOT EXISTS user_announcements (
        id BIGSERIAL PRIMARY KEY,
        announcement_id BIGINT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (announcement_id, user_id)
      );

      -- Store web-push subscriptions (one row per endpoint)
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT,
        auth TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      COMMIT;
    `);
    
    console.log('✅ Announcements tables created successfully');
    
    // Verify tables exist
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('announcements', 'user_announcements', 'push_subscriptions')
      ORDER BY table_name
    `);
    
    console.log('📋 Verified tables:', tablesCheck.rows.map(r => r.table_name).join(', '));
    
    if (tablesCheck.rows.length === 3) {
      console.log('✅ All announcements tables are present');
    } else {
      console.log('⚠️  Some tables may be missing:', tablesCheck.rows);
    }
    
  } catch (error) {
    console.error('❌ Error ensuring announcements tables:', error);
    throw error;
  }
}

async function main() {
  try {
    await ensureAnnouncementsTables();
    console.log('✅ Script completed successfully');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ensureAnnouncementsTables };