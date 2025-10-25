# Production Email Verification Checklist

## Issue: Email verification works on localhost but NOT on production (Render)

## Diagnostic Steps:

### 1. Check Render Environment Variables
Go to Render Dashboard → Your Service → Environment

**Required Environment Variables:**
```
RESEND_API_KEY=re_izDzeaV4_LR74J4cDkgB67iJvkJHdZvQK
EMAIL_FROM=SportsClubNet <no-reply@sportsclubnet.com>
```

**How to verify:**
1. Visit: `https://your-app.onrender.com/debug/email-config`
2. Should show:
   - `backend: "resend"` (NOT "ethereal")
   - `hasResendKey: true`
   - `emailFrom: "SportsClubNet <no-reply@sportsclubnet.com>"`

### 2. Check Render Deployment Logs
Look for these log messages when server starts:

**✅ Good (using Resend):**
```
[EMAIL] Initializing email service...
[EMAIL] RESEND_API_KEY exists: true
[EMAIL] EMAIL_FROM: SportsClubNet <no-reply@sportsclubnet.com>
[EMAIL] Using Resend backend
```

**❌ Bad (using Ethereal test mode):**
```
[EMAIL] Initializing email service...
[EMAIL] RESEND_API_KEY exists: false
[EMAIL] No RESEND_API_KEY found, using Ethereal for testing
```

### 3. Test Signup and Check Logs
When you create a user on production, look for:

**✅ Success logs:**
```
[EMAIL] Attempting to send email:
[EMAIL]   Backend: resend
[EMAIL]   From: SportsClubNet <no-reply@sportsclubnet.com>
[EMAIL]   To: user@example.com
[EMAIL]   Subject: Verify your email
[EMAIL] ✅ Email sent successfully via Resend, ID: abc123...
[auth] Verification email sent to user@example.com
```

**❌ Failure scenarios:**

**Scenario A: No API key (using Ethereal)**
```
[EMAIL]   Backend: ethereal
[EMAIL] Email sent via Ethereal (test mode)
```
→ Fix: Add RESEND_API_KEY to Render environment variables

**Scenario B: Email sending error**
```
[EMAIL] ❌ Failed to send via Resend: Error: ...
[auth] sendEmail failed: ...
```
→ Check the error message for clues

**Scenario C: Wrong email domain**
```
Error: Email address is not verified
```
→ Fix: Make sure EMAIL_FROM uses @sportsclubnet.com, not @resend.dev

### 4. Common Issues & Solutions

#### Issue: "Backend: ethereal" in production
**Cause:** RESEND_API_KEY not set on Render
**Solution:**
1. Go to Render → Environment
2. Add: `RESEND_API_KEY` = `re_izDzeaV4_LR74J4cDkgB67iJvkJHdZvQK`
3. Save (triggers redeploy)

#### Issue: "Email address is not verified"
**Cause:** EMAIL_FROM still using @resend.dev
**Solution:**
1. Go to Render → Environment
2. Add/Update: `EMAIL_FROM` = `SportsClubNet <no-reply@sportsclubnet.com>`
3. Save (triggers redeploy)

#### Issue: Emails sent but verification links don't work
**Cause:** Wrong domain in verification URL
**Check:** Email should contain link like:
- ✅ `https://sportsclubnet.com/auth/verify?token=...`
- ❌ `https://club-booking-app.onrender.com/auth/verify?token=...`

**Solution:** Make sure your custom domain is properly configured on Render

### 5. Quick Verification Commands

**Check email config endpoint:**
```bash
curl https://your-app.onrender.com/debug/email-config
```

**Check Render logs in real-time:**
```bash
# In Render dashboard, go to Logs tab
# Filter for: [EMAIL]
```

### 6. Most Likely Root Cause

Based on "works locally but not in production":

**99% probability:** You have the `.env` file locally with RESEND_API_KEY, but you **haven't added it to Render's environment variables**.

**Fix:**
1. Go to: https://dashboard.render.com
2. Select your service
3. Go to: Environment tab
4. Click "Add Environment Variable"
5. Add:
   - Key: `RESEND_API_KEY`
   - Value: `re_izDzeaV4_LR74J4cDkgB67iJvkJHdZvQK`
6. Add:
   - Key: `EMAIL_FROM`
   - Value: `SportsClubNet <no-reply@sportsclubnet.com>`
7. Click "Save Changes" (this will trigger a redeploy)
8. Wait for deployment to complete (~2-5 minutes)
9. Test signup again

### 7. After Adding Environment Variables

Test the flow:
1. Visit your production app
2. Try to sign up with a new email
3. Check Render logs for `[EMAIL]` messages
4. Email should arrive within 1-2 minutes
5. Click verification link to confirm it works

---

## Need More Help?

If it still doesn't work after setting environment variables:

1. Visit `/debug/email-config` on production
2. Copy the JSON response
3. Check Render logs for any `[EMAIL]` error messages
4. Share both for further debugging
