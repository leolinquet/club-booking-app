#!/usr/bin/env node
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function addColumns() {
  try {
    console.log('Adding tournament settings columns...');
    
    // Add draw_size
    try {
      await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS draw_size INTEGER DEFAULT 16');
      console.log('✅ Added draw_size column');
    } catch (e) {
      if (e.code === '42701') {
        console.log('ℹ️  draw_size column already exists');
      } else {
        throw e;
      }
    }
    
    // Add seed_count
    try {
      await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS seed_count INTEGER DEFAULT 4');
      console.log('✅ Added seed_count column');
    } catch (e) {
      if (e.code === '42701') {
        console.log('ℹ️  seed_count column already exists');
      } else {
        throw e;
      }
    }
    
    // Add points_by_round
    try {
      await pool.query("ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS points_by_round TEXT DEFAULT '{}'");
      console.log('✅ Added points_by_round column');
    } catch (e) {
      if (e.code === '42701') {
        console.log('ℹ️  points_by_round column already exists');
      } else {
        throw e;
      }
    }
    
    // Add format
    try {
      await pool.query("ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'single_elim'");
      console.log('✅ Added format column');
    } catch (e) {
      if (e.code === '42701') {
        console.log('ℹ️  format column already exists');
      } else {
        throw e;
      }
    }
    
    // Add start_date
    try {
      await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS start_date DATE');
      console.log('✅ Added start_date column');
    } catch (e) {
      if (e.code === '42701') {
        console.log('ℹ️  start_date column already exists');
      } else {
        throw e;
      }
    }
    
    // Add block_courts
    try {
      await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS block_courts INTEGER DEFAULT 0');
      console.log('✅ Added block_courts column');
    } catch (e) {
      if (e.code === '42701') {
        console.log('ℹ️  block_courts column already exists');
      } else {
        throw e;
      }
    }
    
    // Add seeds_count (legacy)
    try {
      await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS seeds_count INTEGER DEFAULT 0');
      console.log('✅ Added seeds_count column');
    } catch (e) {
      if (e.code === '42701') {
        console.log('ℹ️  seeds_count column already exists');
      } else {
        throw e;
      }
    }
    
    console.log('\n🎉 All tournament settings columns added successfully!');
    
    // Verify
    const { rows } = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'tournaments' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current tournaments table schema:');
    rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.column_default ? `(default: ${col.column_default})` : ''}`);
    });
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    throw e;
  } finally {
    await pool.end();
  }
}

addColumns();
