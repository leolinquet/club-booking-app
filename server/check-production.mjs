#!/usr/bin/env node

/**
 * Quick diagnostic script to check production database tables
 * Usage: RENDER_DATABASE_URL="your_url" node check-production.mjs
 */

import { Pool } from 'pg';

const DATABASE_URL = process.env.RENDER_DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ RENDER_DATABASE_URL environment variable required');
  console.error('Usage: RENDER_DATABASE_URL="your_url" node check-production.mjs');
  process.exit(1);
}

console.log('🔍 Checking production database tables...');
console.log('📍 Database:', DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // Check database connection
    const { rows: [dbInfo] } = await pool.query('SELECT current_database(), version()');
    console.log('📊 Connected to:', dbInfo.current_database);

    // Check for chat tables specifically
    const { rows: chatTables } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('conversations', 'messages', 'message_reads')
      ORDER BY table_name
    `);
    
    const existingChatTables = chatTables.map(t => t.table_name);
    const requiredChatTables = ['conversations', 'messages', 'message_reads'];
    const missingChatTables = requiredChatTables.filter(t => !existingChatTables.includes(t));

    console.log('\n💬 Chat Tables Status:');
    if (existingChatTables.length > 0) {
      existingChatTables.forEach(table => console.log(`  ✅ ${table}`));
    }
    if (missingChatTables.length > 0) {
      missingChatTables.forEach(table => console.log(`  ❌ ${table} - MISSING`));
      console.log('\n🔧 Fix: Run the migration to create missing tables');
      console.log('   npm run db:sync:prod');
    } else {
      console.log('🎉 All chat tables exist!');
    }

    // Check migration tracking
    const { rows: migrationTable } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = '_migrations_applied'
    `);

    if (migrationTable.length > 0) {
      const { rows: appliedMigrations } = await pool.query(
        'SELECT filename FROM _migrations_applied ORDER BY applied_at'
      );
      console.log(`\n📋 Applied Migrations: ${appliedMigrations.length}`);
      console.log('   Recent migrations:');
      appliedMigrations.slice(-5).forEach(m => console.log(`     - ${m.filename}`));
    } else {
      console.log('\n⚠️  Migration tracking table missing - migrations may not have been run yet');
    }

    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();