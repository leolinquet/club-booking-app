# Database Migration Workflow

This document explains how to keep your local and production databases in sync when developing new features.

## Overview

The app uses **database migrations** to keep track of schema changes. When you add new features that require database changes, you create migration files that can be applied to both local and production databases.

## File Structure

```
server/
├── migrations/           # All migration files (run in order)
│   ├── 000_extensions.sql
│   ├── 001_init.sql
│   ├── 013_create_chat_tables.sql
│   ├── 016_create_message_reads.sql
│   └── ...
├── migrate.mjs          # Standard migration runner
├── db-sync.mjs          # Development sync tool
└── package.json         # Contains migration scripts
```

## How It Works

1. **Migration Files**: SQL files numbered in order (e.g., `017_add_new_feature.sql`)
2. **Migration Tracking**: `_migrations_applied` table tracks which migrations have run
3. **Automatic Deployment**: Production automatically runs pending migrations on deploy
4. **Manual Sync**: You can sync databases manually for development

## Development Workflow

### 1. When Adding New Database Features

**For Copilot or Developers:**

1. Create a new migration file with the next number:
   ```bash
   # Example: adding a new feature
   touch server/migrations/017_add_notifications.sql
   ```

2. Write the SQL for your changes:
   ```sql
   BEGIN;
   
   CREATE TABLE IF NOT EXISTS notifications (
     id SERIAL PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id),
     message TEXT NOT NULL,
     read BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
   
   COMMIT;
   ```

3. Add the file to the migration list in `migrate.mjs`:
   ```javascript
   const files = [
     // ... existing files
     '017_add_notifications.sql',  // Add new file here
   ];
   ```

4. Test locally:
   ```bash
   cd server
   npm run migrate
   ```

### 2. Syncing Databases During Development

**Check what migrations are pending:**
```bash
cd server
node db-sync.mjs --check-only                    # Check local
node db-sync.mjs --production --check-only       # Check production
```

**Apply pending migrations:**
```bash
cd server
node db-sync.mjs                                 # Sync local
node db-sync.mjs --production                    # Sync production
```

### 3. Deployment Process

**Automatic (Recommended):**
- When you push to main branch, Render automatically runs:
  ```bash
  npm run start:prod  # This runs migrations then starts server
  ```

**Manual (if needed):**
```bash
cd server
RENDER_DATABASE_URL="your_render_url" node migrate.mjs
```

## Environment Variables

Add these to your `.env` file:

```bash
# Local database
DATABASE_URL='postgres://user@localhost:5432/clubbooking_local'

# Production database (get from Render dashboard)
RENDER_DATABASE_URL='postgres://user:pass@host:port/database'
```

## Package.json Scripts

```json
{
  "scripts": {
    "migrate": "node migrate.mjs",
    "migrate:production": "node db-sync.mjs --production",
    "migrate:check": "node db-sync.mjs --check-only",
    "migrate:check:prod": "node db-sync.mjs --production --check-only",
    "start:prod": "npm run migrate && node server.js"
  }
}
```

## Best Practices

### ✅ DO:
- Always create migration files for database changes
- Use `IF NOT EXISTS` for CREATE statements
- Use `CREATE OR REPLACE` for functions/triggers
- Test migrations locally before deploying
- Use transactions (BEGIN/COMMIT) in migration files
- Number migration files sequentially

### ❌ DON'T:
- Edit existing migration files after they've been applied
- Skip migrations or apply them out of order
- Make database changes directly without migrations
- Use destructive operations without careful consideration

## Troubleshooting

### "Migration already applied" errors:
```bash
# Check what's applied vs what's expected
node db-sync.mjs --check-only
```

### "Table already exists" errors:
- Use `CREATE TABLE IF NOT EXISTS` in migration files
- Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for new columns

### Production database out of sync:
```bash
# Check production status
node db-sync.mjs --production --check-only

# Sync production
node db-sync.mjs --production
```

### Reset local database (DANGEROUS):
```bash
# This will drop and recreate your local database
dropdb clubbooking_local
createdb clubbooking_local
npm run migrate
```

## For Copilot

When creating new features that require database changes:

1. **Create migration file**: `server/migrations/XXX_feature_name.sql`
2. **Update migrate.mjs**: Add file to the migration list
3. **Test locally**: Run `npm run migrate` to verify
4. **Include in PR**: Migration files should be part of the code changes

The migration will automatically run on Render when the code is deployed.

## Examples

### Adding a New Table:
```sql
-- File: server/migrations/017_add_notifications.sql
BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

COMMIT;
```

### Adding a New Column:
```sql
-- File: server/migrations/018_add_user_preferences.sql
BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light';

COMMIT;
```

This system ensures your local and production databases stay in sync automatically! 🚀