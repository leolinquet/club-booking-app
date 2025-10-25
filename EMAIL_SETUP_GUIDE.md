# Email Sending Setup for SportsClubNet

## Current Issue

Your Resend API key is in **testing mode**, which means:
- ✅ Emails sent to `leolinquet@gmail.com` work
- ❌ Emails sent to other addresses (like `sportsclubnet01@gmail.com`) are blocked

**Error message:**
```
You can only send testing emails to your own email address (leolinquet@gmail.com). 
To send emails to other recipients, please verify a domain at resend.com/domains.
```

## Solution: Verify sportsclubnet.com Domain

### Step 1: Add Domain in Resend Dashboard

1. Go to: https://resend.com/domains
2. Click **"Add Domain"**
3. Enter: `sportsclubnet.com`
4. Click **"Add"**

### Step 2: Get DNS Records

Resend will provide you with DNS records that look like:

```
Type: TXT
Name: @ (or root domain)
Value: resend-verify=abc123xyz...

Type: TXT  
Name: _resend
Value: dkim=...

Type: MX (optional, for receiving)
Name: @
Value: mx.resend.com
Priority: 10
```

### Step 3: Add DNS Records to Your Domain Provider

**Where did you buy sportsclubnet.com?** (GoDaddy, Namecheap, Cloudflare, etc.)

Go to your domain provider's DNS management page and add the records.

Example for common providers:
- **Cloudflare:** DNS → Records → Add Record
- **GoDaddy:** DNS Management → Add Record
- **Namecheap:** Advanced DNS → Add New Record

### Step 4: Wait for Verification

- DNS propagation can take **5 minutes to 48 hours**
- Usually works within 15-30 minutes
- Click "Verify" in Resend dashboard to check status

### Step 5: Update Environment Variables

Once verified, update your `.env` and Render environment variables:

**Local (.env):**
```properties
EMAIL_FROM='SportsClubNet <no-reply@sportsclubnet.com>'
```

**Render Dashboard:**
1. Go to club-booking-app → Environment
2. Update or add: `EMAIL_FROM=SportsClubNet <no-reply@sportsclubnet.com>`
3. Save and redeploy

### Step 6: Test

Run this command to test:
```bash
cd server
node test-email.mjs sportsclubnet01@gmail.com
```

Should see: ✅ Email sent successfully!

## Alternative: Use Verified Test Email

For immediate testing, you can test with your own email:

```bash
cd server
node test-email.mjs leolinquet@gmail.com
```

This should work right now.

## Production Environment Variables Checklist

Make sure these are set in **Render Dashboard → Environment**:

```bash
RESEND_API_KEY=re_izDzeaV4_LR74J4cDkgB67iJvkJHdZvQK
EMAIL_FROM=SportsClubNet <no-reply@sportsclubnet.com>
```

## Current Behavior

✅ **Account creation works** - Users can sign up even if email fails
✅ **Graceful degradation** - Email failures are logged but don't block signup
✅ **Production ready** - Just needs domain verification for full functionality

❌ **Verification emails not sent** - Until domain is verified in Resend

## Quick Test Results

```bash
# Test 1: Send to your email (should work now)
node test-email.mjs leolinquet@gmail.com
# Expected: ✅ Email sent successfully

# Test 2: Send to other email (will fail until domain verified)
node test-email.mjs sportsclubnet01@gmail.com
# Current: ❌ Testing mode restriction
# After domain verification: ✅ Email sent successfully
```

## Next Steps

1. **Verify domain** in Resend (15-30 min setup)
2. **Update EMAIL_FROM** in both .env and Render
3. **Redeploy** or restart Render service
4. **Test** with any email address

## Support Links

- Resend Dashboard: https://resend.com/domains
- Resend Docs: https://resend.com/docs/dashboard/domains/introduction
- DNS Verification Help: https://resend.com/docs/dashboard/domains/verifying

## Notes

- The account `sportsclubnet01@gmail.com` was created successfully on production
- The user can log in but didn't receive verification email (expected with current setup)
- Once domain is verified, all future signups will receive emails automatically
