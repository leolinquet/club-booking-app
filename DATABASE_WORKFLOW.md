# Database Migration Workflow

This document explains how to keep your local and production databases in sync when developing new features.

## The Problem We're Solving

- **Local development**: Database changes happen as you build features
- **Production (Render)**: Database stays behind, causing features to break
- **Solution**: Automated migrations that run on every deployment

## How It Works Now

### ✅ **Automatic Migration on Deploy**
- When you push code to Render, migrations run automatically **before** the server starts
- Only new migrations are applied (no duplicates)
- Failed migrations prevent the app from starting (safety first!)

### ✅ **Migration Tracking**
- `_migrations_applied` table tracks which migrations have run
- Prevents running the same migration twice
- Shows migration history

## Workflow for New Features

### 1. **When Copilot Makes Database Changes**

If Copilot creates tables, adds columns, or modifies the database structure:

```bash
# Create a new migration file
cd server
npm run migrate:new "describe_the_change"

# Example:
npm run migrate:new "add_user_preferences"
npm run migrate:new "create_chat_tables"
npm run migrate:new "add_notifications"
```

### 2. **Fill in the Migration File**

Edit the generated migration file (e.g., `017_add_user_preferences.sql`):

```sql
BEGIN;

-- Add user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

COMMIT;
```

### 3. **Test Locally**

```bash
# Run migrations locally
npm run migrate

# Start your dev server
npm run dev
```

### 4. **Deploy**

```bash
git add .
git commit -m "Add user preferences feature"
git push origin main
```

**That's it!** The migration will run automatically on Render.

## Available Commands

```bash
# Create new migration file
npm run migrate:new "migration_name"

# Run all pending migrations
npm run migrate

# Check what migrations would run (dry run)
npm run migrate:check

# Force run even destructive migrations
npm run migrate:force

# Start server (runs migrations first)
npm start
```

## For Copilot AI

When making database changes:

1. **Always create a migration file** for any new tables, columns, or schema changes
2. **Use the migration template** - run `npm run migrate:new "description"`
3. **Include in your changes** - add the migration file to your code changes
4. **Test the migration** - make sure it works locally before pushing

### Common Migration Patterns

```sql
-- Create new table
CREATE TABLE IF NOT EXISTS table_name (
  id SERIAL PRIMARY KEY,
  -- columns here
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add column to existing table
ALTER TABLE existing_table 
ADD COLUMN IF NOT EXISTS new_column TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_table_column 
ON table_name(column_name);

-- Add foreign key
ALTER TABLE child_table 
ADD CONSTRAINT fk_child_parent 
FOREIGN KEY (parent_id) REFERENCES parent_table(id);
```

## Troubleshooting

### ❌ **Migration Fails on Render**
- Check Render logs for the specific error
- Fix the migration file locally
- Test with `npm run migrate` locally
- Push the fix

### ❌ **Tables Missing on Render**
- Check if migration file exists for the feature
- Look at `_migrations_applied` table to see what ran
- Create missing migration if needed

### ❌ **Local and Production Out of Sync**
- Run `npm run migrate` locally to catch up
- Check migration files are committed to git
- Ensure all team members run migrations locally

## Best Practices

1. **Always use migrations** - Never manually modify production database
2. **Test locally first** - Run migrations locally before pushing
3. **Use IF NOT EXISTS** - Makes migrations safe to re-run
4. **One feature per migration** - Easier to track and rollback
5. **Descriptive names** - Clear migration file names
6. **Include indexes** - Don't forget performance optimizations

## Migration History

Check what migrations have been applied:

```sql
SELECT filename, applied_at 
FROM _migrations_applied 
ORDER BY applied_at;
```