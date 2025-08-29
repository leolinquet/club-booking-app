import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ✅ Use the SAME DB as server.js
const DB_FILE = path.join(__dirname, '../data.db');

// ✅ schema.sql lives in /server next to server.js
const SCHEMA_FILE = path.join(__dirname, '../schema.sql');

const schema = fs.readFileSync(SCHEMA_FILE, 'utf8');
const db = new Database(DB_FILE);
db.exec(schema);
console.log(`Database initialized at: ${DB_FILE}`);
