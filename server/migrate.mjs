// server/migrate.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { q } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

async function run() {
  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.includes('.old.')) // ignore archived files
    .sort();

  for (const f of files) {
    const full = path.join(migrationsDir, f);
    const sql = fs.readFileSync(full, 'utf8');
    console.log('Running', f);
    try {
      await q(sql);
    } catch (e) {
      console.error(`\nFailed on ${f}:`, e);
      process.exit(1);
    }
  }
  console.log('Done.');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
