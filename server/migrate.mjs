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
].map(f => path.join(MIG_DIR, f));

(async () => {
  try {
    for (const f of files) {
      console.log('> applying', f);
      const sql = fs.readFileSync(f, 'utf8');
      await pool.query(sql);
    }
    await pool.end();
    console.log('migrations done');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
