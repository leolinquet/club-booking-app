import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./data.db');
const schema = fs.readFileSync('./schema.sql','utf8');
db.exec(schema);
console.log('Database initialized.');
