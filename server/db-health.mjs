#!/usr/bin/env node

/**
 * Database Health Check System
 * 
 * Validates database integrity and reports potential issues
 * before they cause data loss.
 */

import { Pool } from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const { DATABASE_URL, FORCE_PG_SSL, NODE_ENV } = process.env;

async function checkDatabaseHealth() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const useSSL = /sslmode=require/i.test(DATABASE_URL) || FORCE_PG_SSL === '1' || NODE_ENV === 'production';
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  console.log('🏥 Database Health Check');
  console.log('========================');
  console.log('📍 Environment:', NODE_ENV || 'development');
  console.log('📍 Database:', DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  console.log('');

  let healthScore = 0;
  let maxScore = 0;
  const issues = [];
  const warnings = [];

  try {
    // Test 1: Basic connectivity
    console.log('1️⃣  Testing database connectivity...');
    maxScore += 10;
    try {
      const { rows: [dbInfo] } = await pool.query('SELECT current_database(), version()');
      console.log('   ✅ Connected to:', dbInfo.current_database);
      console.log('   📊 Version:', dbInfo.version.split(' ').slice(0, 2).join(' '));
      healthScore += 10;
    } catch (error) {
      console.log('   ❌ Connection failed');
      issues.push('Cannot connect to database');
      throw error;
    }

    // Test 2: Core tables exist
    console.log('2️⃣  Checking core table structure...');
    maxScore += 15;
    const requiredTables = ['users', 'clubs', 'user_clubs', 'sports', 'courts', 'bookings'];
    
    for (const table of requiredTables) {
      try {
        await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`   ✅ Table exists: ${table}`);
        healthScore += 2.5;
      } catch (error) {
        console.log(`   ❌ Missing table: ${table}`);
        issues.push(`Missing required table: ${table}`);
      }
    }

    // Test 3: User data integrity
    console.log('3️⃣  Checking user data integrity...');
    maxScore += 15;
    
    try {
      const { rows: userStats } = await pool.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN display_name IS NOT NULL THEN 1 END) as users_with_names,
          COUNT(CASE WHEN active_club_id IS NOT NULL THEN 1 END) as users_with_active_club
        FROM users
      `);
      
      const stats = userStats[0];
      console.log(`   📊 Total users: ${stats.total_users}`);
      console.log(`   📊 Users with display names: ${stats.users_with_names}`);
      console.log(`   📊 Users with active clubs: ${stats.users_with_active_club}`);
      
      if (parseInt(stats.total_users) > 0) {
        healthScore += 5;
        
        if (parseInt(stats.users_with_names) === parseInt(stats.total_users)) {
          healthScore += 5;
        } else {
          warnings.push(`${parseInt(stats.total_users) - parseInt(stats.users_with_names)} users missing display names`);
        }
        
        if (parseInt(stats.users_with_active_club) > 0) {
          healthScore += 5;
        } else {
          warnings.push('No users have active clubs assigned');
        }
      } else {
        issues.push('No users found in database');
      }
    } catch (error) {
      console.log('   ❌ User data check failed');
      issues.push('Cannot validate user data');
    }

    // Test 4: Club data integrity
    console.log('4️⃣  Checking club data integrity...');
    maxScore += 15;
    
    try {
      const { rows: clubStats } = await pool.query(`
        SELECT 
          COUNT(*) as total_clubs,
          COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as clubs_with_names
        FROM clubs
      `);
      
      const stats = clubStats[0];
      console.log(`   📊 Total clubs: ${stats.total_clubs}`);
      console.log(`   📊 Clubs with names: ${stats.clubs_with_names}`);
      
      if (parseInt(stats.total_clubs) > 0) {
        healthScore += 10;
        
        if (parseInt(stats.clubs_with_names) === parseInt(stats.total_clubs)) {
          healthScore += 5;
        } else {
          warnings.push(`${parseInt(stats.total_clubs) - parseInt(stats.clubs_with_names)} clubs missing names`);
        }
      } else {
        issues.push('No clubs found in database');
      }
    } catch (error) {
      console.log('   ❌ Club data check failed');
      issues.push('Cannot validate club data');
    }

    // Test 5: Relationship integrity
    console.log('5️⃣  Checking relationship integrity...');
    maxScore += 15;
    
    try {
      // Check for orphaned user_clubs
      const { rows: orphanedUserClubs } = await pool.query(`
        SELECT COUNT(*) as count FROM user_clubs uc
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = uc.user_id)
           OR NOT EXISTS (SELECT 1 FROM clubs c WHERE c.id = uc.club_id)
      `);
      
      // Check for invalid active_club_id references
      const { rows: invalidActiveClubs } = await pool.query(`
        SELECT COUNT(*) as count FROM users u
        WHERE u.active_club_id IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM clubs c WHERE c.id = u.active_club_id)
      `);
      
      const orphanedCount = parseInt(orphanedUserClubs[0].count);
      const invalidCount = parseInt(invalidActiveClubs[0].count);
      
      if (orphanedCount === 0 && invalidCount === 0) {
        console.log('   ✅ All relationships are valid');
        healthScore += 15;
      } else {
        if (orphanedCount > 0) {
          console.log(`   ⚠️  ${orphanedCount} orphaned user-club relationships`);
          warnings.push(`${orphanedCount} orphaned user-club relationships`);
          healthScore += 10;
        }
        if (invalidCount > 0) {
          console.log(`   ❌ ${invalidCount} users with invalid active_club_id`);
          issues.push(`${invalidCount} users with invalid active_club_id references`);
          healthScore += 5;
        }
      }
    } catch (error) {
      console.log('   ❌ Relationship check failed');
      issues.push('Cannot validate relationships');
    }

    // Test 6: Migration tracking
    console.log('6️⃣  Checking migration system...');
    maxScore += 15;
    
    try {
      const { rows: migrationCheck } = await pool.query(`
        SELECT COUNT(*) as migration_count 
        FROM information_schema.tables 
        WHERE table_name = '_migrations_applied'
      `);
      
      if (parseInt(migrationCheck[0].migration_count) > 0) {
        const { rows: appliedMigrations } = await pool.query(`
          SELECT COUNT(*) as count FROM _migrations_applied
        `);
        console.log(`   ✅ Migration tracking active (${appliedMigrations[0].count} applied)`);
        healthScore += 15;
      } else {
        console.log('   ⚠️  Migration tracking not set up');
        warnings.push('Migration tracking table missing');
        healthScore += 5;
      }
    } catch (error) {
      console.log('   ❌ Migration check failed');
      issues.push('Cannot check migration system');
    }

    // Test 7: Chat system (if available)
    console.log('7️⃣  Checking chat system...');
    maxScore += 15;
    
    try {
      const chatTables = ['conversations', 'messages', 'message_reads'];
      let chatTablesFound = 0;
      
      for (const table of chatTables) {
        try {
          await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
          chatTablesFound++;
        } catch (error) {
          // Table doesn't exist
        }
      }
      
      if (chatTablesFound === chatTables.length) {
        console.log('   ✅ Chat system fully installed');
        healthScore += 15;
      } else if (chatTablesFound > 0) {
        console.log(`   ⚠️  Chat system partially installed (${chatTablesFound}/${chatTables.length} tables)`);
        warnings.push('Chat system incomplete');
        healthScore += 7;
      } else {
        console.log('   ➖ Chat system not installed');
        healthScore += 10; // Not an issue if not needed
      }
    } catch (error) {
      console.log('   ❌ Chat system check failed');
      issues.push('Cannot check chat system');
    }

    await pool.end();

    // Results summary
    console.log('');
    console.log('📊 Health Check Results');
    console.log('=======================');
    
    const healthPercentage = Math.round((healthScore / maxScore) * 100);
    
    if (healthPercentage >= 90) {
      console.log(`🟢 Overall Health: ${healthPercentage}% - EXCELLENT`);
    } else if (healthPercentage >= 75) {
      console.log(`🟡 Overall Health: ${healthPercentage}% - GOOD`);
    } else if (healthPercentage >= 50) {
      console.log(`🟠 Overall Health: ${healthPercentage}% - NEEDS ATTENTION`);
    } else {
      console.log(`🔴 Overall Health: ${healthPercentage}% - CRITICAL`);
    }
    
    console.log(`📈 Score: ${healthScore}/${maxScore}`);
    
    if (warnings.length > 0) {
      console.log('');
      console.log('⚠️  Warnings:');
      warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    if (issues.length > 0) {
      console.log('');
      console.log('❌ Critical Issues:');
      issues.forEach(issue => console.log(`   • ${issue}`));
      console.log('');
      console.log('🔧 Recommended Actions:');
      console.log('   1. Create a backup: node db-backup.mjs create health-check');
      console.log('   2. Run migrations: node migrate.mjs');
      console.log('   3. Verify data integrity');
    }
    
    if (healthPercentage < 75) {
      console.log('');
      console.log('💡 Consider creating a backup before making any changes');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

// Main CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--help' || args[0] === '-h') {
    console.log('🏥 Database Health Check');
    console.log('');
    console.log('Usage: node db-health.mjs');
    console.log('');
    console.log('This script checks your database for:');
    console.log('• Basic connectivity');
    console.log('• Required table structure');
    console.log('• Data integrity');
    console.log('• Relationship consistency');
    console.log('• Migration system status');
    console.log('');
    console.log('Exit codes:');
    console.log('• 0: Health check passed (>= 75% score)');
    console.log('• 1: Issues found or health check failed');
    return;
  }
  
  await checkDatabaseHealth();
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { checkDatabaseHealth };