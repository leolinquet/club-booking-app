#!/usr/bin/env node

/**
 * Check what tables exist on Render database
 * Usage: RENDER_DATABASE_URL="your_render_db_url" node check_render_tables.mjs
 */

import { Pool } from 'pg';

const RENDER_DATABASE_URL = process.env.RENDER_DATABASE_URL;
if (!RENDER_DATABASE_URL) {
  console.error('RENDER_DATABASE_URL environment variable is required');
  console.error('Usage: RENDER_DATABASE_URL="your_render_db_url" node check_render_tables.mjs');
  process.exit(1);
}

console.log('🔍 Checking tables on Render database...');
console.log('📍 Database:', RENDER_DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

const pool = new Pool({
  connectionString: RENDER_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // Check database info
    const { rows: [dbInfo] } = await pool.query('SELECT current_database(), version()');
    console.log('📊 Database:', dbInfo.current_database);
    console.log('📊 Version:', dbInfo.version.split(' ').slice(0, 3).join(' '));

    // Check all tables
    const { rows: allTables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 All tables:');
    allTables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Check specifically for chat tables
    const chatTables = ['conversations', 'messages', 'message_reads'];
    const existingChatTables = allTables.filter(t => chatTables.includes(t.table_name)).map(t => t.table_name);
    const missingChatTables = chatTables.filter(t => !existingChatTables.includes(t));

    console.log('\n💬 Chat tables status:');
    existingChatTables.forEach(table => {
      console.log(`  ✅ ${table} - exists`);
    });
    missingChatTables.forEach(table => {
      console.log(`  ❌ ${table} - missing`);
    });

    if (missingChatTables.length > 0) {
      console.log('\n🔧 To fix: run the migration script with your render database URL');
      console.log('   RENDER_DATABASE_URL="your_url" node migrate_render.mjs');
    } else {
      console.log('\n🎉 All chat tables exist!');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  }
})();