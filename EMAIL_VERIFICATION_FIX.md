# Email Verification Fix - Production Signup Error

## Problem
Production signup was failing with 500 errors due to:
1. Missing database columns for email verification (`email_verify_token`, `email_verify_expires`)
2. Incorrect `sendEmail()` function call signature in auth routes

## Root Causes

### 1. Database Schema Missing Columns
The production database was created from `001_init.sql` which only had `email_verified_at` but was missing:
- `email_verify_token` (for storing verification tokens)
- `email_verify_expires` (for token expiration)

### 2. Incorrect Email Function Call
The `sendEmail()` function in `server/email/resend.js` expects an object with named parameters:
```javascript
sendEmail({ to, subject, html })
```

But it was being called with positional arguments in `auth/routes.js`:
```javascript
sendEmail(email, subject, html)  // ❌ Wrong
```

## Changes Made

### 1. Created Migration 018
**File:** `server/migrations/018_add_email_verification_columns.sql`

Adds the missing columns to the users table:
```sql
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email_verify_token TEXT,
  ADD COLUMN IF NOT EXISTS email_verify_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_email_verify_token ON users(email_verify_token);
```

### 2. Updated Initial Migrations
**Files:**
- `server/migrations/001_init.sql`
- `server/migrations/001_init_production_safe.sql`

Added the columns to the CREATE TABLE statement so new databases have them from the start:
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified_at TIMESTAMPTZ,
  email_verify_token TEXT,           -- ✅ Added
  email_verify_expires TIMESTAMPTZ   -- ✅ Added
);
```

### 3. Fixed sendEmail Call
**File:** `server/auth/routes.js` (line 100)

Changed from positional to object syntax:
```javascript
// Before ❌
await sendEmail(
  values.email,
  'Verify your email',
  `<p>Welcome! Please verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
);

// After ✅
await sendEmail({
  to: values.email,
  subject: 'Verify your email',
  html: `<p>Welcome! Please verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
});
```

### 4. Added Migration to migrate.mjs
**File:** `server/migrate.mjs`

Added `'018_add_email_verification_columns.sql'` to the files array.

## Email Verification Behavior

### Current Setup
- **RESEND_API_KEY** is configured in `.env`
- **EMAIL_FROM** is set to `'SportsClubNet <onboarding@resend.dev>'`
- All new signups will receive verification emails (no email restrictions)

### How It Works
1. User signs up with email/password
2. Account is created immediately
3. If email verification columns exist:
   - Token is generated and stored
   - Verification email is sent via Resend
   - Response includes `mode: 'email-verify'`
4. User clicks link in email
5. `/api/auth/verify?token=xxx` marks `email_verified_at`
6. User can log in (verification is informational, not required for login)

## Deployment Steps

### For Production (Render)

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Fix email verification: add missing DB columns and fix sendEmail call"
   git push origin main
   ```

2. **Render will auto-deploy** the new code

3. **Run migration on production database:**
   - Go to Render Dashboard → club-booking-app → Shell
   - Run:
     ```bash
     cd server
     npm run migrate
     ```
   - This will apply migration 018 and add the missing columns

4. **Verify:**
   - Try signing up a new user at https://www.sportsclubnet.com
   - Check that verification email is received
   - Check Render logs for any errors

### For Local Development

Migration is ready to run:
```bash
cd server
npm run migrate
```

## Testing Checklist

- ✅ Migration 018 created and added to migrate.mjs
- ✅ sendEmail call fixed to use object syntax
- ✅ Initial migrations updated for future clean installs
- ⏳ Need to run migration on production database
- ⏳ Need to test signup on production

## Notes

- Email verification is **optional** - users can log in even without verifying
- The code checks for column existence before trying to send verification emails
- If columns don't exist, signup still works (just no email verification)
- Resend API key is configured and ready to send emails
- No email address restrictions - all signups will get verification emails
