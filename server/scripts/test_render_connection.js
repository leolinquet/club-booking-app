#!/usr/bin/env node
/**
 * Test connection to Render database
 * 
 * Usage:
 *   DATABASE_URL=<your-render-database-url> node scripts/test_render_connection.js
 * 
 * This will verify you can connect to the Render database before running setup scripts.
 */

import pg from 'pg';
const { Pool } = pg;

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error('❌ Usage: DATABASE_URL=<your-render-url> node scripts/test_render_connection.js');
  console.error('');
  console.error('Example:');
  console.error('DATABASE_URL=postgres://user:pass@dpg-xyz.oregon-postgres.render.com/dbname node scripts/test_render_connection.js');
  process.exit(1);
}

const useSSL = /sslmode=require/i.test(DATABASE_URL) || process.env.FORCE_PG_SSL === '1';
const pool = new Pool({
  connectionString: DATABASE_URL,
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

async function testConnection() {
  console.log('🔗 Testing connection to Render database...');
  console.log('📍 Target URL:', DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  
  try {
    // Test basic connection
    const start = Date.now();
    const { rows: [result] } = await pool.query(`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        inet_server_addr() as server_ip,
        version() as pg_version
    `);
    const duration = Date.now() - start;
    
    console.log('✅ Connection successful!');
    console.log(`📊 Database: ${result.database_name}`);
    console.log(`👤 User: ${result.user_name}`);
    console.log(`🌐 Server: ${result.server_ip || 'N/A'}`);
    console.log(`🗄️  PostgreSQL: ${result.pg_version.split(' ').slice(0, 2).join(' ')}`);
    console.log(`⏱️  Response time: ${duration}ms`);
    
    // Check if this looks like a Render database
    const isRender = DATABASE_URL.includes('render.com') || 
                     DATABASE_URL.includes('oregon-postgres') ||
                     DATABASE_URL.includes('frankfurt-postgres') ||
                     DATABASE_URL.includes('singapore-postgres');
    
    if (isRender) {
      console.log('🎯 ✅ This appears to be a Render database');
    } else {
      console.log('⚠️  This does not appear to be a Render database URL');
      console.log('   Make sure you\'re using the correct DATABASE_URL from Render dashboard');
    }
    
    // Quick check for announcements tables
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('announcements', 'user_announcements', 'push_subscriptions')
      ORDER BY table_name
    `);
    
    const existingTables = rows.map(r => r.table_name);
    const missingTables = ['announcements', 'user_announcements', 'push_subscriptions']
      .filter(t => !existingTables.includes(t));
    
    if (missingTables.length === 0) {
      console.log('📋 ✅ All announcements tables already exist');
      console.log('   You may not need to run the setup script');
    } else {
      console.log('📋 ❌ Missing announcements tables:', missingTables.join(', '));
      console.log('   ➡️  You should run: node scripts/render_setup_announcements.js');
    }
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 This usually means the hostname is incorrect');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - check if the database is running');
    } else if (error.message.includes('password authentication failed')) {
      console.error('💡 Check your username/password in the DATABASE_URL');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('💡 Check the database name in your DATABASE_URL');
    }
    
    throw error;
  }
}

async function main() {
  try {
    await testConnection();
    console.log('\n🎉 Connection test completed successfully!');
    console.log('💡 You can now safely run other Render database scripts');
  } catch (error) {
    console.error('\n❌ Connection test failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}