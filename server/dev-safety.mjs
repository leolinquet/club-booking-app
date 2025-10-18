#!/usr/bin/env node

/**
 * Development Safety Hooks
 * 
 * Automatically creates backups when certain risky operations are detected
 */

import { createBackup, cleanOldBackups } from './db-backup.mjs';
import { checkDatabaseHealth } from './db-health.mjs';
import { fileURLToPath } from 'node:url';

// Create backup before risky operations
async function safetyBackup(operation) {
  console.log(`🛡️  Safety backup before ${operation}...`);
  
  try {
    await createBackup(`before-${operation}`);
    console.log('✅ Safety backup created');
    
    // Clean old backups to save space (keep last 5 safety backups)
    cleanOldBackups(5);
    
    return true;
  } catch (error) {
    console.warn('⚠️  Safety backup failed:', error.message);
    console.warn('⚠️  Continuing without backup - consider manual backup');
    return false;
  }
}

// Quick health check before operations
async function quickHealthCheck() {
  console.log('🏥 Quick health check...');
  
  try {
    await checkDatabaseHealth();
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Pre-migration hook
async function preMigration() {
  console.log('🔄 Pre-migration safety checks...');
  
  const healthOk = await quickHealthCheck();
  if (!healthOk) {
    console.error('❌ Database health check failed - migration aborted');
    console.error('💡 Run: node db-health.mjs for detailed analysis');
    process.exit(1);
  }
  
  await safetyBackup('migration');
  console.log('✅ Pre-migration checks complete');
}

// Pre-seed hook
async function preSeed() {
  console.log('🌱 Pre-seed safety checks...');
  await safetyBackup('seed');
  console.log('✅ Pre-seed checks complete');
}

// Daily backup (can be used in cron or npm scripts)
async function dailyBackup() {
  console.log('📅 Creating daily backup...');
  
  try {
    await createBackup('daily');
    cleanOldBackups(7); // Keep 7 daily backups
    console.log('✅ Daily backup complete');
  } catch (error) {
    console.error('❌ Daily backup failed:', error.message);
    process.exit(1);
  }
}

// Main CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'pre-migration':
      await preMigration();
      break;
      
    case 'pre-seed':
      await preSeed();
      break;
      
    case 'daily':
      await dailyBackup();
      break;
      
    case 'safety':
      const operation = args[1] || 'unknown';
      await safetyBackup(operation);
      break;
      
    default:
      console.log('🛡️  Development Safety Hooks');
      console.log('');
      console.log('Usage:');
      console.log('  node dev-safety.mjs pre-migration    # Run before migrations');
      console.log('  node dev-safety.mjs pre-seed         # Run before seeding');
      console.log('  node dev-safety.mjs daily            # Daily backup');
      console.log('  node dev-safety.mjs safety <op>      # Manual safety backup');
      break;
  }
}

// Export for use in other scripts
export { safetyBackup, quickHealthCheck, preMigration, preSeed, dailyBackup };

// Run CLI if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}