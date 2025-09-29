#!/usr/bin/env node
/**
 * Render DB Setup Script - Ensures announcements tables exist
 * 
 * Run this on Render to fix 404 errors for announcements endpoints.
 * 
 * On Render console:
 *   node scripts/render_setup_announcements.js
 * 
 * Or as a one-time deployment script.
 */

import pg from 'pg';
const { Pool } = pg;

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Initialize database connection
const useSSL = /sslmode=require/i.test(DATABASE_URL) || process.env.FORCE_PG_SSL === '1';
const pool = new Pool({
  connectionString: DATABASE_URL,
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

async function setupAnnouncementsTables() {
  console.log('🚀 Setting up announcements tables on Render database...');
  console.log('📍 Database:', DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  
  try {
    // Check current database connection
    const { rows: [{ current_database }] } = await pool.query('SELECT current_database()');
    console.log('📊 Connected to database:', current_database);
    
    // Execute the announcements migration
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
    
    console.log('✅ Announcements tables created/verified successfully');
    
    // Verify all required tables exist
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('announcements', 'user_announcements', 'push_subscriptions')
      ORDER BY table_name
    `);
    
    const existingTables = rows.map(r => r.table_name);
    console.log('📋 Verified tables exist:', existingTables.join(', '));
    
    if (existingTables.length === 3) {
      console.log('✅ All required announcements tables are present');
      console.log('🎉 Announcements feature should now work on Render!');
    } else {
      console.log('⚠️  Missing tables:', ['announcements', 'user_announcements', 'push_subscriptions'].filter(t => !existingTables.includes(t)));
    }
    
    // Test basic functionality by checking if we can query the tables
    const announcementsCount = await pool.query('SELECT COUNT(*) as count FROM announcements');
    console.log('📊 Current announcements count:', announcementsCount.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error setting up announcements tables:', error);
    console.error('Details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    throw error;
  }
}

async function main() {
  try {
    await setupAnnouncementsTables();
    console.log('✅ Render setup completed successfully');
    console.log('🔄 Restart your Render service to ensure changes take effect');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}