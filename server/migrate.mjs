import { Pool } from 'pg';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const { DATABASE_URL, FORCE_PG_SSL } = process.env;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set (expected in server/.env)');
  process.exit(1);
}

const useSSL = /sslmode=require/i.test(DATABASE_URL) || FORCE_PG_SSL === '1';
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
].map(f => path.join(MIG_DIR, f));
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

const allowForce = process.env.ALLOW_DESTRUCTIVE_MIGRATIONS === '1' || process.argv.includes('--force');

(async () => {
  try {
    for (const f of files) {
      console.log('> preparing', f);
      const sql = fs.readFileSync(f, 'utf8');

      if (looksDestructive(sql) && !allowForce) {
        console.error('\nERROR: migration looks destructive:', f);
        console.error('This file appears to contain DROP/TRUNCATE statements which will remove data.');
        console.error('To run destructive migrations intentionally, set ALLOW_DESTRUCTIVE_MIGRATIONS=1 in the environment or pass the --force flag.');
        console.error('Aborting migration run to avoid accidental data loss.');
        process.exit(2);
      }

      console.log('> applying', f);
      await pool.query(sql);
    }

    await pool.end();
    console.log('migrations done');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
