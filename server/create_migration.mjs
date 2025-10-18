#!/usr/bin/env node

/**
 * Generate a new migration file from existing database changes
 * This helps when Copilot makes database changes that need to be migrated
 */

import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const migrationName = process.argv[2];
if (!migrationName) {
  console.error('❌ Migration name is required');
  console.error('Usage: node create_migration.mjs "add_new_feature"');
  console.error('Example: node create_migration.mjs "add_user_preferences"');
  process.exit(1);
}

// Get next migration number
const migrationsDir = path.join(__dirname, 'migrations');
const existingMigrations = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .map(f => parseInt(f.split('_')[0]))
  .filter(n => !isNaN(n))
  .sort((a, b) => b - a);

const nextNumber = existingMigrations.length > 0 ? existingMigrations[0] + 1 : 1;
const paddedNumber = String(nextNumber).padStart(3, '0');
const filename = `${paddedNumber}_${migrationName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.sql`;
const filepath = path.join(migrationsDir, filename);

const template = `BEGIN;

-- ${migrationName}
-- Add your SQL statements here

-- Example:
-- CREATE TABLE IF NOT EXISTS example_table (
--   id SERIAL PRIMARY KEY,
--   name TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE INDEX IF NOT EXISTS idx_example_table_name ON example_table(name);

COMMIT;`;

fs.writeFileSync(filepath, template);

console.log('✅ Created new migration file:');
console.log(`📄 ${filename}`);
console.log(`📁 ${filepath}`);
console.log('');
console.log('📝 Next steps:');
console.log('1. Edit the migration file to add your SQL statements');
console.log('2. Test locally: npm run migrate');
console.log('3. Commit and push - migration will run automatically on Render');
console.log('');
console.log('💡 Pro tip: You can copy SQL from your existing database changes');
console.log('   and paste them into the migration file!');