#!/usr/bin/env node
/**
 * Render Database Diagnostic Script
 * 
 * Checks which tables exist and identifies missing tables that might cause 404s.
 * Run this on Render to diagnose the announcements issue.
 * 
 * Usage on Render console:
 *   node scripts/render_diagnose.js
 */

import pg from 'pg';
const { Pool } = pg;

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const useSSL = /sslmode=require/i.test(DATABASE_URL) || process.env.FORCE_PG_SSL === '1';
const pool = new Pool({
  connectionString: DATABASE_URL,
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

const EXPECTED_TABLES = [
  'users',
  'clubs', 
  'user_clubs',
  'players',
  'tournaments',
  'tournament_players',
  'matches',
  'standings',
  'courts',
  'bookings',
  'announcements',
  'user_announcements', 
  'push_subscriptions',
  'club_sports'
];

async function diagnoseDatabase() {
  console.log('🔍 Diagnosing Render database...');
  console.log('📍 Database URL:', DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  
  try {
    // Check database connection and identity
    const { rows: [dbInfo] } = await pool.query('SELECT current_database() as db, current_user as user, version()');
    console.log('📊 Connected to database:', dbInfo.db, 'as user:', dbInfo.user);
    console.log('🗄️  Database version:', dbInfo.version.split(' ').slice(0, 2).join(' '));
    
    // Get all existing tables
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const existingTables = rows.map(r => r.table_name);
    const missingTables = EXPECTED_TABLES.filter(t => !existingTables.includes(t));
    
    console.log('\n📋 EXISTING TABLES (' + existingTables.length + '):');
    existingTables.forEach(table => console.log('  ✅', table));
    
    if (missingTables.length > 0) {
      console.log('\n❌ MISSING TABLES (' + missingTables.length + '):');
      missingTables.forEach(table => console.log('  ❌', table));
      
      // Check specifically for announcements tables
      const missingAnnouncementsTables = missingTables.filter(t => 
        ['announcements', 'user_announcements', 'push_subscriptions'].includes(t)
      );
      
      if (missingAnnouncementsTables.length > 0) {
        console.log('\n🚨 ANNOUNCEMENTS ISSUE DETECTED:');
        console.log('   Missing tables:', missingAnnouncementsTables.join(', '));
        console.log('   This explains the 404 errors for announcements endpoints!');
        console.log('\n💡 SOLUTION:');
        console.log('   Run: node scripts/render_setup_announcements.js');
        console.log('   Or: npm run migrate (if migrations haven\'t been run)');
      }
    } else {
      console.log('\n✅ All expected tables are present!');
    }
    
    // Check for data in key tables
    console.log('\n📊 TABLE SIZES:');
    for (const table of existingTables) {
      try {
        const { rows: [{ count }] } = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
        console.log(`  ${table}: ${count} rows`);
      } catch (e) {
        console.log(`  ${table}: error counting (${e.message})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error diagnosing database:', error);
    console.error('Details:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await diagnoseDatabase();
    console.log('\n✅ Diagnosis completed');
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}