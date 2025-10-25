# Deployment Checklist - Email Verification & Webhooks

## What's Being Deployed

✅ Email verification with database columns
✅ Resend webhook support for email event tracking
✅ Automatic migrations on deployment
✅ Improved email error logging

## Pre-Deployment Checklist

### 1. Domain Verification in Resend

- [ ] Add `sportsclubnet.com` to Resend domains
- [ ] Add DNS records to Squarespace:
  - [ ] TXT record: `resend._domainkey` → `p=MIGfMA0GCS...`
  - [ ] MX record: `send` → `feedback-smtp.us-east-1.amazonses.com` (priority 10)
  - [ ] TXT record: `send` → `v=spf1 include:amazonses.com ~all`
  - [ ] TXT record: `_dmarc` → `v=DMARC1; p=none;`
- [ ] Wait 15-30 minutes for DNS propagation
- [ ] Click "Verify" in Resend dashboard
- [ ] Domain shows as "Verified" ✅

### 2. Webhook Setup in Resend

- [ ] Go to Resend → Webhooks
- [ ] Click "Create Webhook"
- [ ] Enter URL: `https://club-booking-app.onrender.com/webhooks/resend`
- [ ] Select events:
  - [ ] email.sent
  - [ ] email.delivered
  - [ ] email.bounced
  - [ ] email.opened
  - [ ] email.clicked
  - [ ] email.complained
- [ ] Copy the webhook secret (starts with `whsec_...`)

### 3. Update Render Environment Variables

Go to Render Dashboard → club-booking-app → Environment tab:

- [ ] Add/Update: `EMAIL_FROM=SportsClubNet <no-reply@sportsclubnet.com>`
- [ ] Add: `RESEND_WEBHOOK_SECRET=whsec_...` (paste from Resend)
- [ ] Verify: `RESEND_API_KEY` is still set
- [ ] Verify: `DATABASE_URL` points to production Postgres

### 4. Code Changes Ready

- [ ] All changes committed to `login-email-verification` branch
- [ ] No syntax errors in code
- [ ] Migrations tested locally

## Deployment Steps

### Step 1: Commit Changes

```bash
cd /Users/leolopez-linquet/Documents/club-booking-app

# Check what's changed
git status

# Add all changes
git add -A

# Commit
git commit -m "Add email verification and webhook support

- Add email_verify_token and email_verify_expires columns to users table
- Fix sendEmail() call to use object syntax
- Add Resend webhook endpoint at /webhooks/resend
- Create email_events table to log all email events
- Add automatic migration on production deployment
- Update logging for better email debugging
"
```

### Step 2: Merge to Main

```bash
# Switch to main
git checkout main

# Merge the feature branch
git merge login-email-verification

# Push to GitHub (triggers Render deployment)
git push origin main
```

### Step 3: Monitor Deployment

1. Go to Render Dashboard → club-booking-app
2. Watch the **"Events"** tab for deployment progress
3. Should see:
   ```
   Build started...
   Build succeeded
   Deploy started...
   Running migrations... (this is new!)
   🚀 Starting database migration...
   ✅ Applied successfully: 018_add_email_verification_columns.sql
   ✅ Applied successfully: 019_create_email_events.sql
   🎉 Migration completed!
   server listening on :5051
   Deploy succeeded
   ```

### Step 4: Verify Migration Ran

Check the logs in Render for these lines:
```
🚀 Starting database migration...
📊 Connected to database: [your-db-name]
🔄 Found X new migration(s) to apply
✅ Applied successfully: 018_add_email_verification_columns.sql
✅ Applied successfully: 019_create_email_events.sql
```

### Step 5: Test Email Sending

#### Test 1: Webhook Endpoint
```bash
curl https://club-booking-app.onrender.com/webhooks/resend/test
```

Expected response:
```json
{
  "message": "Webhook endpoint is ready",
  "secret_configured": true
}
```

#### Test 2: Create New User

1. Go to https://www.sportsclubnet.com
2. Click "Create account"
3. Enter email: `test@example.com` (or any email)
4. Enter password
5. Submit

#### Test 3: Check Email Received

- Check inbox for verification email
- Should come from `SportsClubNet <no-reply@sportsclubnet.com>`
- Click verification link

#### Test 4: Check Webhook Events

Go to Resend Dashboard → Webhooks → Your webhook → Recent deliveries

Should see events like:
- `email.sent` - Email accepted
- `email.delivered` - Email delivered
- `email.opened` - (if user opened it)

## Post-Deployment Verification

### Database Check

The migrations should have created:

```sql
-- These columns should exist in users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('email_verify_token', 'email_verify_expires');

-- This table should exist
SELECT * FROM email_events LIMIT 1;
```

### Logs Check

In Render logs, search for:
- `[webhook]` - Webhook events
- `[auth]` - Authentication events
- `Verification email sent` - Successful email sends

## Troubleshooting

### If Migration Fails

Check Render logs for migration errors. Common issues:

**Error: "column already exists"**
- Migration was already applied
- This is OK, migrations are idempotent

**Error: "relation does not exist"**
- Check that DATABASE_URL points to correct database
- Verify previous migrations ran successfully

### If Emails Don't Send

**Check 1: Domain verified?**
```
Go to Resend → Domains → sportsclubnet.com
Should show: ✅ Verified
```

**Check 2: Environment variable set?**
```
Render → Environment → EMAIL_FROM
Should be: SportsClubNet <no-reply@sportsclubnet.com>
```

**Check 3: API key valid?**
```
Render → Environment → RESEND_API_KEY
Should be: re_...
```

**Check 4: Logs show errors?**
```
Render → Logs → Search for "[auth] sendEmail failed"
```

### If Webhook Not Receiving Events

**Check 1: Webhook URL correct?**
```
Resend → Webhooks → Your webhook
URL: https://club-booking-app.onrender.com/webhooks/resend
```

**Check 2: Events selected?**
```
At least email.sent, email.delivered should be checked
```

**Check 3: Secret configured?**
```
Render → Environment → RESEND_WEBHOOK_SECRET
Should start with: whsec_...
```

**Check 4: Test the endpoint**
```bash
curl https://club-booking-app.onrender.com/webhooks/resend/test
```

## Rollback Plan (If Needed)

If something goes wrong:

### Option 1: Revert Code
```bash
git revert HEAD
git push origin main
```

### Option 2: Rollback Migration

Migrations are designed to be safe with `IF NOT EXISTS`, but if needed:

```sql
-- Remove email verification columns (only if absolutely necessary)
ALTER TABLE users DROP COLUMN IF EXISTS email_verify_token;
ALTER TABLE users DROP COLUMN IF EXISTS email_verify_expires;

-- Remove email events table
DROP TABLE IF EXISTS email_events;

-- Remove from migrations log
DELETE FROM _migrations_applied WHERE filename IN (
  '018_add_email_verification_columns.sql',
  '019_create_email_events.sql'
);
```

## Success Criteria

✅ Render deployment succeeds
✅ Migrations run automatically (visible in logs)
✅ New signups create accounts
✅ Verification emails are sent
✅ Webhook receives events from Resend
✅ Events logged to `email_events` table
✅ No errors in Render logs

## Timeline

- **Code Push**: Immediate
- **Render Build**: ~3-5 minutes
- **Migration**: ~10 seconds
- **Deployment**: ~1 minute
- **Total**: ~5-7 minutes

## Support Links

- Render Dashboard: https://dashboard.render.com
- Resend Dashboard: https://resend.com/emails
- Webhook Guide: See `WEBHOOK_SETUP_GUIDE.md`
- Email Setup: See `EMAIL_SETUP_GUIDE.md`

## After Successful Deployment

1. Test signup with your email
2. Verify email arrives
3. Click verification link
4. Check webhook events in Resend
5. Query `email_events` table to see logged events
6. Update this document with any lessons learned

## Notes

- Migrations run automatically on every deployment
- If migration already applied, it will skip (safe)
- Webhook events are logged even if email fails
- Signature verification protects against fake webhooks
- All email events are stored for analytics

---

**Last Updated**: October 24, 2025
**Next Deployment**: After domain verification complete
