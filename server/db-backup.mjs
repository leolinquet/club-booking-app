#!/usr/bin/env node

/**
 * Database Backup System
 * 
 * Creates automated backups of your local database before running migrations
 * and provides easy restore functionality.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);
dotenv.config({ path: path.join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(__dirname, 'backups');

// Parse database URL to get connection info
function parseDatabaseUrl(url) {
  const match = url.match(/postgres:\/\/([^:]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  return {
    user: match[1],
    host: match[2],
    port: match[3],
    database: match[4]
  };
}

// Create backup directory if it doesn't exist
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('📁 Created backup directory:', BACKUP_DIR);
  }
}

// Create a database backup
async function createBackup(label = '') {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const db = parseDatabaseUrl(DATABASE_URL);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupLabel = label ? `_${label}` : '';
  const filename = `clubbooking_backup_${timestamp}${backupLabel}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  ensureBackupDir();

  console.log('🔄 Creating database backup...');
  console.log('📍 Database:', db.database);
  console.log('📄 Backup file:', filename);

  try {
    // Create the backup using pg_dump
    await execAsync(`pg_dump -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -f "${filepath}"`);
    
    // Get file size
    const stats = fs.statSync(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Backup created successfully!');
    console.log(`📊 Backup size: ${fileSizeMB} MB`);
    console.log(`📂 Location: ${filepath}`);
    
    return filepath;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

// List available backups
function listBackups() {
  ensureBackupDir();
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => {
      const filepath = path.join(BACKUP_DIR, f);
      const stats = fs.statSync(filepath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      return {
        filename: f,
        filepath,
        created: stats.mtime,
        sizeMB
      };
    })
    .sort((a, b) => b.created - a.created);

  console.log('📋 Available backups:');
  if (files.length === 0) {
    console.log('   No backups found');
    return [];
  }

  files.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.filename}`);
    console.log(`      Created: ${file.created.toLocaleString()}`);
    console.log(`      Size: ${file.sizeMB} MB`);
    console.log('');
  });

  return files;
}

// Restore from backup
async function restoreBackup(backupFile) {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const db = parseDatabaseUrl(DATABASE_URL);
  
  if (!fs.existsSync(backupFile)) {
    console.error('❌ Backup file not found:', backupFile);
    process.exit(1);
  }

  console.log('⚠️  WARNING: This will COMPLETELY REPLACE your current database!');
  console.log('📍 Target database:', db.database);
  console.log('📄 Backup file:', path.basename(backupFile));
  
  try {
    console.log('🔄 Restoring database...');
    
    // Drop and recreate database
    await execAsync(`dropdb -h ${db.host} -p ${db.port} -U ${db.user} ${db.database} --if-exists`);
    await execAsync(`createdb -h ${db.host} -p ${db.port} -U ${db.user} ${db.database}`);
    
    // Restore from backup
    await execAsync(`psql -h ${db.host} -p ${db.port} -U ${db.user} -d ${db.database} -f "${backupFile}"`);
    
    console.log('✅ Database restored successfully!');
    console.log('🔧 You may need to restart your development server');
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

// Clean old backups (keep only last N backups)
function cleanOldBackups(keepCount = 10) {
  const files = listBackups();
  
  if (files.length <= keepCount) {
    console.log(`✅ Only ${files.length} backups found, no cleanup needed`);
    return;
  }

  const toDelete = files.slice(keepCount);
  console.log(`🧹 Cleaning up ${toDelete.length} old backup(s)...`);
  
  toDelete.forEach(file => {
    fs.unlinkSync(file.filepath);
    console.log(`   Deleted: ${file.filename}`);
  });
  
  console.log('✅ Cleanup complete');
}

// Main CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'create':
        const label = args[1];
        await createBackup(label);
        break;
        
      case 'list':
        listBackups();
        break;
        
      case 'restore':
        const backupFile = args[1];
        if (!backupFile) {
          console.error('❌ Please specify backup file path');
          console.log('Usage: node db-backup.mjs restore <backup-file-path>');
          process.exit(1);
        }
        await restoreBackup(backupFile);
        break;
        
      case 'clean':
        const keepCount = parseInt(args[1]) || 10;
        cleanOldBackups(keepCount);
        break;
        
      default:
        console.log('🔧 Database Backup System');
        console.log('');
        console.log('Usage:');
        console.log('  node db-backup.mjs create [label]     # Create backup');
        console.log('  node db-backup.mjs list               # List backups');
        console.log('  node db-backup.mjs restore <file>     # Restore backup');
        console.log('  node db-backup.mjs clean [count]      # Clean old backups');
        console.log('');
        console.log('Examples:');
        console.log('  node db-backup.mjs create before-migration');
        console.log('  node db-backup.mjs restore backups/clubbooking_backup_2025-10-16.sql');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other scripts
export { createBackup, listBackups, restoreBackup, cleanOldBackups };

// Run CLI if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}