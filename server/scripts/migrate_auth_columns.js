// server/scripts/migrate_auth_columns.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, '..', 'data.db'));
db.pragma('foreign_keys = ON');

function hasCol(table, col) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  return cols.includes(col);
}
function addCol(table, col, type) {
  if (!hasCol(table, col)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`).run();
    console.log(`+ ${table}.${col} (${type})`);
  }
}

addCol('users', 'email', 'TEXT');
addCol('users', 'password_hash', 'TEXT');
addCol('users', 'email_verify_token', 'TEXT');
addCol('users', 'email_verify_expires', 'TEXT');
addCol('users', 'email_verified_at', 'TEXT');
addCol('users', 'username', 'TEXT');
addCol('users', 'is_test', 'INTEGER DEFAULT 0');

try { db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL`).run(); } catch {}
try { db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL`).run(); } catch {}

console.log('Done.');
