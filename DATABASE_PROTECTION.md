# Database Protection & Recovery Guide

This guide helps prevent and recover from database data loss incidents.

## 🛡️ Prevention (Use These Daily!)

### 1. Health Checks
Run before making any database changes:
```bash
cd server
npm run db:health
```

### 2. Create Backups
**Before migrations:**
```bash
npm run migrate:safe  # Auto-backup + migrate
```

**Manual backup:**
```bash
npm run db:backup  # Creates timestamped backup
npm run db:backup create my-backup-label  # With custom label
```

### 3. Daily Backup (Recommended)
Add to your daily routine:
```bash
npm run db:backup:daily
```

## 🔧 Backup Management

### List Backups
```bash
npm run db:backup:list
```

### Clean Old Backups
```bash
npm run db:backup:clean  # Keeps last 10 backups
```

### Restore from Backup
```bash
npm run db:backup:restore path/to/backup.sql
```

## 🚨 Emergency Recovery

### If You Lose Data (Like Today):

1. **Stop all servers immediately**
   ```bash
   pkill -f "node server.js"
   ```

2. **Check what backups are available**
   ```bash
   npm run db:backup:list
   ```

3. **If you have a recent backup, restore it**
   ```bash
   npm run db:backup:restore backups/your-backup-file.sql
   ```

4. **If no backup, check database state**
   ```bash
   npm run db:health
   ```

5. **Restore missing data manually** (if needed)
   ```bash
   psql postgres://leolopez-linquet@localhost:5432/clubbooking_local
   ```

### Common Recovery SQL Commands

**Check what's missing:**
```sql
-- Check users
SELECT id, display_name, active_club_id FROM users;

-- Check clubs
SELECT id, name FROM clubs;

-- Check user-club relationships
SELECT uc.user_id, u.display_name, uc.club_id, c.name, uc.role 
FROM user_clubs uc
JOIN users u ON uc.user_id = u.id
LEFT JOIN clubs c ON uc.club_id = c.id;
```

**Restore leolinquet's clubs:**
```sql
-- Add missing clubs
INSERT INTO clubs (id, name, address, timezone) VALUES 
(11, 'Hacoaj', 'Buenos Aires', 'America/Argentina/Buenos_Aires'),
(13, 'Huskers', 'Buenos Aires', 'America/Argentina/Buenos_Aires');

-- Add user-club relationships
INSERT INTO user_clubs (user_id, club_id, role) VALUES 
(1, 11, 'manager'),
(1, 13, 'manager');

-- Set active club
UPDATE users SET active_club_id = 11 WHERE id = 1;
```

## 📋 Safety Checklist

**Before ANY database operation:**
- [ ] Run health check: `npm run db:health`
- [ ] Create backup: `npm run db:backup`
- [ ] Verify backup was created: `npm run db:backup:list`

**Before migrations:**
- [ ] Use safe migration: `npm run migrate:safe`
- [ ] Check migration result: `npm run db:health`

**Weekly maintenance:**
- [ ] Create weekly backup: `npm run db:backup create weekly`
- [ ] Clean old backups: `npm run db:backup:clean`
- [ ] Run full health check: `npm run db:health`

## 🔄 Automated Protection

The system now automatically:

1. **Creates backups before migrations** - Every migration run creates a backup first
2. **Validates database health** - Checks integrity before risky operations
3. **Tracks applied migrations** - Prevents re-running and conflicts
4. **Cleans old backups** - Keeps storage manageable

## 📁 Backup Storage

Backups are stored in: `server/backups/`

**Naming convention:**
- `clubbooking_backup_YYYY-MM-DD_HH-MM-SS.sql` (automatic)
- `clubbooking_backup_YYYY-MM-DD_HH-MM-SS_label.sql` (labeled)

## 🚀 Production Safety

For production deployments:

1. **Always backup production before deploying**
2. **Test migrations on local copy first**
3. **Use safe migration scripts**
4. **Monitor health after deployment**

## 🆘 When Things Go Wrong

1. **Don't panic** - Data can usually be recovered
2. **Stop the application** immediately to prevent further damage
3. **Check backups** - Most recent backup is your friend
4. **Document what happened** - For future prevention
5. **Ask for help** if needed

## 📞 Quick Commands Reference

```bash
# Emergency commands
npm run db:health                    # Check database status
npm run db:backup create emergency   # Emergency backup
npm run db:backup:list              # See available backups
npm run db:backup:restore <file>     # Restore backup

# Daily use
npm run migrate:safe                 # Safe migration with backup
npm run db:backup:daily             # Daily backup
npm run db:backup:clean             # Clean old backups

# Development
npm run db:safety <operation>        # Manual safety backup
npm run migrate                     # Regular migration (no backup)
```

Remember: **When in doubt, backup first!** 🛡️