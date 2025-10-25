# Resend Webhook Setup Guide

## What We Just Built

✅ **Webhook endpoint** at `/webhooks/resend`
✅ **Database table** to log all email events
✅ **Security** with signature verification
✅ **Event handling** for all Resend email events

## How to Configure in Resend Dashboard

### Step 1: Go to Webhooks Section

1. Log in to [resend.com](https://resend.com)
2. Click **"Webhooks"** in the left sidebar
3. Click **"Create Webhook"** or **"Add Endpoint"**

### Step 2: Configure Webhook

#### Webhook URL (Production):
```
https://club-booking-app.onrender.com/webhooks/resend
```

#### Webhook URL (Development - for testing locally):
You'll need to use a tool like **ngrok** to expose your local server:
```bash
# Install ngrok: brew install ngrok
ngrok http 5051
# Then use the https URL ngrok gives you:
https://abc123.ngrok.io/webhooks/resend
```

#### Events to Subscribe To:

Select these events (or all):
- ✅ **email.sent** - Email was accepted by Resend
- ✅ **email.delivered** - Email was successfully delivered
- ✅ **email.delivery_delayed** - Delivery was delayed
- ✅ **email.complained** - Recipient marked as spam
- ✅ **email.bounced** - Email bounced (hard or soft)
- ✅ **email.opened** - Recipient opened the email
- ✅ **email.clicked** - Recipient clicked a link

### Step 3: Get Webhook Secret

After creating the webhook, Resend will show you a **Signing Secret**.

**Copy this secret!** It looks like:
```
whsec_abc123xyz789...
```

### Step 4: Add Secret to Environment Variables

#### For Local Development:
Update `server/.env`:
```properties
RESEND_WEBHOOK_SECRET=whsec_abc123xyz789...
```

#### For Production (Render):
1. Go to Render Dashboard
2. Click on **club-booking-app**
3. Go to **Environment** tab
4. Add new variable:
   - **Key:** `RESEND_WEBHOOK_SECRET`
   - **Value:** `whsec_abc123xyz789...` (paste the secret from Resend)
5. Click **Save Changes**
6. Render will automatically redeploy

### Step 5: Test the Webhook

#### Test Endpoint is Ready:
```bash
curl https://club-booking-app.onrender.com/webhooks/resend/test
```

Should return:
```json
{
  "message": "Webhook endpoint is ready",
  "secret_configured": true
}
```

#### Send a Test Email:
After domain verification, send a test email:
```bash
cd server
node test-email.mjs your-email@example.com
```

Then check Resend dashboard → Webhooks → your webhook → Recent deliveries to see the events!

## What Happens When an Event Arrives

### 1. Resend sends event to your webhook:
```json
{
  "type": "email.delivered",
  "created_at": "2025-10-24T12:00:00.000Z",
  "data": {
    "email_id": "abc-123",
    "to": "user@example.com",
    "from": "no-reply@sportsclubnet.com",
    "subject": "Verify your email"
  }
}
```

### 2. Your server receives it:
- ✅ Verifies the signature (security)
- ✅ Logs to database (`email_events` table)
- ✅ Handles specific event types
- ✅ Returns 200 OK

### 3. You can query the events:
```sql
-- See all email events
SELECT * FROM email_events ORDER BY created_at DESC LIMIT 10;

-- See bounced emails
SELECT recipient, data FROM email_events 
WHERE event_type = 'email.bounced';

-- See who opened emails
SELECT recipient, created_at FROM email_events 
WHERE event_type = 'email.opened'
ORDER BY created_at DESC;
```

## Viewing Webhook Events

### In Resend Dashboard:
1. Go to **Webhooks**
2. Click on your webhook
3. See **Recent deliveries** tab
4. See success/failure for each event sent

### In Your Database:
```bash
# Connect to local database
psql postgres://leolopez-linquet@localhost:5432/clubbooking_local

# Query events
SELECT 
  event_type, 
  recipient, 
  created_at 
FROM email_events 
ORDER BY created_at DESC 
LIMIT 20;
```

### In Production Logs (Render):
1. Go to Render Dashboard
2. Click **Logs** tab
3. Search for `[webhook]` to see webhook events

## Event Types You'll See

### email.sent
✉️ Email accepted by Resend and queued for delivery

### email.delivered
✅ Email successfully delivered to recipient's inbox

### email.bounced
❌ Email bounced - recipient address may be invalid
- **Hard bounce**: Permanent failure (bad email address)
- **Soft bounce**: Temporary failure (mailbox full, server down)

### email.complained
🚫 Recipient marked email as spam
- Consider removing them from your email list

### email.opened
👁️ Recipient opened the email (tracking pixel)
- Only works if HTML email with tracking enabled

### email.clicked
🖱️ Recipient clicked a link in the email
- Shows which URL was clicked

## Troubleshooting

### Webhook returns 401 "Invalid signature"
- Check that `RESEND_WEBHOOK_SECRET` is set correctly
- Make sure you copied the full secret from Resend

### No events showing up
- Check Resend dashboard → Webhooks → Recent deliveries
- See if Resend is getting 200 OK responses
- Check your server logs for errors

### Testing locally
Use ngrok to expose localhost:
```bash
ngrok http 5051
# Use the https URL in Resend webhook settings
```

## Security Notes

✅ **Signature verification** - Every webhook is verified using HMAC SHA256
✅ **Replay protection** - Timestamps prevent replay attacks
✅ **HTTPS only** - Webhooks only work over HTTPS (Render provides this)
✅ **Secret key** - Never commit your webhook secret to git

## Next Steps After Setup

1. ✅ Add webhook in Resend dashboard
2. ✅ Copy webhook secret to environment variables
3. ✅ Redeploy on Render
4. ✅ Test by sending an email
5. ✅ Verify events appear in database

## Future Enhancements

You can extend the webhook handler to:

- **Auto-retry failed emails** after soft bounces
- **Mark users as invalid** after hard bounces
- **Track engagement metrics** (open rates, click rates)
- **Send notifications** when important emails bounce
- **Create dashboards** showing email delivery stats
- **Automatically unsubscribe** users who mark as spam

## Example Queries for Analytics

```sql
-- Delivery success rate
SELECT 
  COUNT(CASE WHEN event_type = 'email.delivered' THEN 1 END) * 100.0 / COUNT(*) as delivery_rate
FROM email_events 
WHERE event_type IN ('email.delivered', 'email.bounced');

-- Most engaged users (opened emails)
SELECT 
  recipient, 
  COUNT(*) as opens
FROM email_events 
WHERE event_type = 'email.opened'
GROUP BY recipient 
ORDER BY opens DESC 
LIMIT 10;

-- Bounce rate by email
SELECT 
  DATE(created_at) as date,
  COUNT(*) as bounces
FROM email_events 
WHERE event_type = 'email.bounced'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Support

- Resend Webhook Docs: https://resend.com/docs/dashboard/webhooks/introduction
- Signature Verification: https://resend.com/docs/dashboard/webhooks/event-types
- Your webhook endpoint: `/webhooks/resend`
- Test endpoint: `/webhooks/resend/test`
