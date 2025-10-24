import { Pool } from 'pg';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createBackup } from './db-backup.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const { DATABASE_URL, FORCE_PG_SSL, NODE_ENV } = process.env;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set (expected in server/.env)');
  process.exit(1);
}

console.log('🚀 Starting database migration...');
console.log('📍 Environment:', NODE_ENV || 'development');
console.log('📍 Database:', DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

const useSSL = /sslmode=require/i.test(DATABASE_URL) || FORCE_PG_SSL === '1' || NODE_ENV === 'production';
const pool = new Pool({
  connectionString: DATABASE_URL,
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

const MIG_DIR = path.join(__dirname, 'migrations');
const files = [
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
  '015_remove_club_sport_default.sql',
  '016_create_message_reads.sql',
  '017_add_tournament_settings.sql',
].map(f => path.join(MIG_DIR, f));
function looksDestructive(sql) {
  if (!sql || typeof sql !== 'string') return false;
  
  // Truly destructive patterns that remove data
  const destructivePatterns = [
    /\bDROP\s+TABLE\b(?!\s+IF\s+EXISTS)/i,  // DROP TABLE but not DROP TABLE IF EXISTS
    /\bDROP\s+SCHEMA\b/i,
    /\bTRUNCATE\s+TABLE\b/i,
    /\bDROP\s+DATABASE\b/i,
    /\bDELETE\s+FROM\b/i  // DELETE statements
  ];
  
  // Safe DROP patterns that don't remove data
  const safeDropPatterns = [
    /\bDROP\s+TABLE\s+IF\s+EXISTS\b/i,
    /\bDROP\s+INDEX\b/i,
    /\bDROP\s+CONSTRAINT\b/i,
    /\bDROP\s+TRIGGER\b/i,
    /\bDROP\s+FUNCTION\b/i,
    /\bDROP\s+VIEW\b/i,
    /\bALTER\s+TABLE\s+\w+\s+ALTER\s+COLUMN\s+\w+\s+DROP\s+(DEFAULT|NOT\s+NULL)\b/i
  ];
  
  // If it contains safe DROP patterns, it's not destructive
  if (safeDropPatterns.some(rx => rx.test(sql))) {
    return false;
  }
  
  // Check for truly destructive patterns
  return destructivePatterns.some(rx => rx.test(sql));
}

const allowForce = process.env.ALLOW_DESTRUCTIVE_MIGRATIONS === '1' || process.argv.includes('--force');

(async () => {
  try {
    // Test connection first
    const { rows: [dbInfo] } = await pool.query('SELECT current_database(), version()');
    console.log('📊 Connected to database:', dbInfo.current_database);
    
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations_applied (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get list of already applied migrations
    const { rows: appliedMigrations } = await pool.query(
      'SELECT filename FROM _migrations_applied ORDER BY applied_at'
    );
    const appliedFiles = new Set(appliedMigrations.map(m => m.filename));
    
    console.log('📋 Previously applied migrations:', appliedFiles.size);
    appliedFiles.forEach(filename => console.log('  ✅', filename));

    // Check if there are new migrations to apply
    const pendingMigrations = files.filter(f => !appliedFiles.has(path.basename(f)));
    
    if (pendingMigrations.length > 0) {
      console.log('🔄 Found', pendingMigrations.length, 'new migration(s) to apply');
      
      // Create backup before applying migrations
      console.log('💾 Creating backup before migration...');
      try {
        await createBackup('before-migration');
        console.log('✅ Backup created successfully');
      } catch (backupError) {
        console.warn('⚠️  Backup failed, but continuing with migration:', backupError.message);
        console.warn('⚠️  Proceeding without backup - consider creating manual backup');
      }
    }

    let newMigrations = 0;

    for (const f of files) {
      const filename = path.basename(f);
      
      if (appliedFiles.has(filename)) {
        console.log('⏭️  Skipping already applied:', filename);
        continue;
      }

      console.log('📄 Preparing new migration:', filename);
      const sql = fs.readFileSync(f, 'utf8');

      if (looksDestructive(sql) && !allowForce) {
        console.error('\n❌ ERROR: migration looks destructive:', filename);
        console.error('This file appears to contain DROP/TRUNCATE statements which will remove data.');
        console.error('To run destructive migrations intentionally, set ALLOW_DESTRUCTIVE_MIGRATIONS=1 in the environment or pass the --force flag.');
        console.error('Aborting migration run to avoid accidental data loss.');
        process.exit(2);
      }

      console.log('🔧 Applying migration:', filename);
      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query(
          'INSERT INTO _migrations_applied (filename) VALUES ($1)',
          [filename]
        );
        await pool.query('COMMIT');
        console.log('✅ Applied successfully:', filename);
        newMigrations++;
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Failed to apply migration:', filename);
        throw error;
      }
    }

    await pool.end();
    
    if (newMigrations > 0) {
      console.log(`🎉 Migration completed! Applied ${newMigrations} new migration(s)`);
    } else {
      console.log('✅ Database is up to date - no new migrations to apply');
    }
  } catch (e) {
    console.error('❌ Migration failed:', e);
    await pool.end();
    process.exit(1);
  }
})();
