#!/usr/bin/env node

/**
 * Run migrations against Render database
 * Usage: RENDER_DATABASE_URL="your_render_db_url" node migrate_render.mjs
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RENDER_DATABASE_URL = process.env.RENDER_DATABASE_URL;
if (!RENDER_DATABASE_URL) {
  console.error('RENDER_DATABASE_URL environment variable is required');
  console.error('Usage: RENDER_DATABASE_URL="your_render_db_url" node migrate_render.mjs');
  process.exit(1);
}

console.log('🚀 Running migrations against Render database...');
console.log('📍 Database:', RENDER_DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

const pool = new Pool({
  connectionString: RENDER_DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Render requires SSL
});

const MIG_DIR = path.join(__dirname, 'migrations');
const files = [
  '013_create_chat_tables.sql',     // Chat tables (conversations, messages)
  '016_create_message_reads.sql',   // Message read tracking
].map(f => path.join(MIG_DIR, f));

(async () => {
  try {
    // Test connection
    const { rows: [{ current_database }] } = await pool.query('SELECT current_database()');
    console.log('📊 Connected to database:', current_database);

    for (const f of files) {
      console.log('📄 Applying migration:', path.basename(f));
      const sql = fs.readFileSync(f, 'utf8');
      await pool.query(sql);
      console.log('✅ Applied:', path.basename(f));
    }

    // Verify tables were created
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('conversations', 'messages', 'message_reads')
      ORDER BY table_name
    `);
    
    const existingTables = rows.map(r => r.table_name);
    console.log('📋 Verified chat tables exist:', existingTables.join(', '));
    
    if (existingTables.length === 3) {
      console.log('🎉 Chat feature should now work on Render!');
    } else {
      console.log('⚠️  Missing tables:', ['conversations', 'messages', 'message_reads'].filter(t => !existingTables.includes(t)));
    }

    await pool.end();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
})();