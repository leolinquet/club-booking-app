#!/usr/bin/env node

/**
 * Database Synchronization Tool
 * 
 * This script helps keep your local and production databases in sync
 * by running any pending migrations.
 * 
 * Usage:
 *   node db-sync.mjs                    # Sync local database
 *   node db-sync.mjs --production       # Sync production database
 *   node db-sync.mjs --check-only       # Just check status, don't apply
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const isProduction = args.includes('--production');
const checkOnly = args.includes('--check-only');
const force = args.includes('--force');

// Determine which database to use
let DATABASE_URL, FORCE_PG_SSL;
if (isProduction) {
  DATABASE_URL = process.env.RENDER_DATABASE_URL || process.env.PRODUCTION_DATABASE_URL;
  FORCE_PG_SSL = '1'; // Always use SSL for production
  if (!DATABASE_URL) {
    console.error('❌ Production database URL not found!');
    console.error('Set RENDER_DATABASE_URL or PRODUCTION_DATABASE_URL in your .env file');
    process.exit(1);
  }
} else {
  DATABASE_URL = process.env.DATABASE_URL;
  FORCE_PG_SSL = process.env.FORCE_PG_SSL;
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

console.log('🔄 Database Synchronization Tool');
console.log('📍 Target:', isProduction ? 'PRODUCTION' : 'LOCAL');
console.log('📍 Database:', DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
console.log('📍 Mode:', checkOnly ? 'CHECK ONLY' : 'SYNC');

const useSSL = /sslmode=require/i.test(DATABASE_URL) || FORCE_PG_SSL === '1' || isProduction;
const pool = new Pool({
  connectionString: DATABASE_URL,
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

// List of all migration files in order
const MIG_DIR = path.join(__dirname, 'migrations');
const migrationFiles = [
  '000_extensions.sql',
  '001_init.sql',
  '002_seed_courts.sql',
  '006_players_and_points_reset.sql',
  '007_add_user_columns.sql',
  '008_add_club_columns.sql',
  '009_create_club_sports.sql',
  '010_add_club_timezone.sql',
  '011_create_announcements.sql',
  '012_club_requests_invitations.sql',
  '013_create_chat_tables.sql',
  '014_create_feedback.sql',
  '016_create_message_reads.sql',
];

function looksDestructive(sql) {
  if (!sql || typeof sql !== 'string') return false;
  const destructivePatterns = [
    /\bDROP\s+TABLE\b/i,
    /\bDROP\s+SCHEMA\b/i,
    /\bTRUNCATE\s+TABLE\b/i,
    /\bDROP\s+DATABASE\b/i
  ];
  return destructivePatterns.some(rx => rx.test(sql));
}

(async () => {
  try {
    // Test connection
    const { rows: [dbInfo] } = await pool.query('SELECT current_database(), version()');
    console.log('📊 Connected to:', dbInfo.current_database);
    console.log('📊 PostgreSQL:', dbInfo.version.split(' ').slice(0, 2).join(' '));

    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations_applied (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const { rows: appliedMigrations } = await pool.query(
      'SELECT filename FROM _migrations_applied ORDER BY applied_at'
    );
    const appliedFiles = new Set(appliedMigrations.map(m => m.filename));

    // Check which migrations need to be applied
    const pendingMigrations = migrationFiles.filter(file => !appliedFiles.has(file));

    console.log('\n📋 Migration Status:');
    console.log(`   Applied: ${appliedFiles.size}/${migrationFiles.length}`);
    console.log(`   Pending: ${pendingMigrations.length}`);

    if (appliedFiles.size > 0) {
      console.log('\n✅ Applied migrations:');
      appliedMigrations.forEach(m => {
        console.log(`   ${m.filename} (${new Date(m.applied_at).toLocaleString()})`);
      });
    }

    if (pendingMigrations.length > 0) {
      console.log('\n📄 Pending migrations:');
      pendingMigrations.forEach(file => console.log(`   ${file}`));

      if (checkOnly) {
        console.log('\n📋 Check complete - no changes made');
        await pool.end();
        return;
      }

      console.log('\n🔧 Applying pending migrations...');
      
      for (const filename of pendingMigrations) {
        const filepath = path.join(MIG_DIR, filename);
        console.log(`\n📄 Processing: ${filename}`);
        
        const sql = fs.readFileSync(filepath, 'utf8');

        // Check for destructive operations
        if (looksDestructive(sql) && !force) {
          console.error(`❌ Migration ${filename} contains destructive operations!`);
          console.error('Use --force flag if you really want to run this migration');
          if (isProduction) {
            console.error('⚠️  PRODUCTION DATABASE - extra caution required!');
          }
          process.exit(2);
        }

        // Apply migration in transaction
        await pool.query('BEGIN');
        try {
          await pool.query(sql);
          await pool.query(
            'INSERT INTO _migrations_applied (filename) VALUES ($1)',
            [filename]
          );
          await pool.query('COMMIT');
          console.log(`✅ Applied: ${filename}`);
        } catch (error) {
          await pool.query('ROLLBACK');
          console.error(`❌ Failed to apply: ${filename}`);
          console.error('Error:', error.message);
          throw error;
        }
      }

      console.log(`\n🎉 Successfully applied ${pendingMigrations.length} migration(s)!`);
    } else {
      console.log('\n✅ Database is up to date - no pending migrations');
    }

    // Show final status
    console.log('\n📊 Final Status:');
    console.log(`   Database: ${dbInfo.current_database}`);
    console.log(`   Migrations: ${migrationFiles.length}/${migrationFiles.length} applied`);
    console.log(`   Environment: ${isProduction ? 'PRODUCTION' : 'LOCAL'}`);

    await pool.end();
    console.log('\n✅ Database sync completed successfully!');

  } catch (error) {
    console.error('\n❌ Database sync failed:', error.message);
    await pool.end();
    process.exit(1);
  }
})();