// server/routes/webhooks.js
import express from 'express';
import crypto from 'crypto';
import { run } from '../db.js';

const router = express.Router();

// Resend webhook signature verification
function verifyWebhookSignature(req, secret) {
  if (!secret) {
    console.warn('[webhook] RESEND_WEBHOOK_SECRET not set - skipping signature verification');
    return true; // Allow in development if secret not set
  }

  const signature = req.headers['svix-signature'];
  const timestamp = req.headers['svix-timestamp'];
  const webhookId = req.headers['svix-id'];

  if (!signature || !timestamp || !webhookId) {
    console.error('[webhook] Missing required headers');
    return false;
  }

  // Reconstruct the signed content
  const signedContent = `${webhookId}.${timestamp}.${JSON.stringify(req.body)}`;
  
  // Get the expected signature from the header (format: v1,signature)
  const signatureParts = signature.split(',');
  const expectedSignature = signatureParts.find(part => part.startsWith('v1='))?.slice(3);

  if (!expectedSignature) {
    console.error('[webhook] No v1 signature found');
    return false;
  }

  // Calculate the signature using HMAC SHA256
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedContent);
  const computedSignature = hmac.digest('base64');

  // Compare signatures
  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(computedSignature)
  );

  if (!isValid) {
    console.error('[webhook] Signature verification failed');
  }

  return isValid;
}

// POST /webhooks/resend - handle Resend email events
router.post('/resend', express.json({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!verifyWebhookSignature(req, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('[webhook] Received Resend event:', event.type);

    // Log the event to database
    try {
      await run(
        `INSERT INTO email_events (event_type, email_id, recipient, data, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        event.type || 'unknown',
        event.data?.email_id || null,
        event.data?.to || null,
        JSON.stringify(event)
      );
    } catch (dbError) {
      console.error('[webhook] Failed to log event to database:', dbError.message);
      // Continue even if DB insert fails - don't block webhook
    }

    // Handle specific event types
    switch (event.type) {
      case 'email.sent':
        console.log(`[webhook] Email sent to ${event.data?.to}`);
        break;

      case 'email.delivered':
        console.log(`[webhook] Email delivered to ${event.data?.to}`);
        break;

      case 'email.bounced':
        console.warn(`[webhook] Email bounced for ${event.data?.to}:`, event.data?.bounce_type);
        // TODO: Mark user email as invalid in database
        break;

      case 'email.complained':
        console.warn(`[webhook] Spam complaint from ${event.data?.to}`);
        // TODO: Unsubscribe user from emails
        break;

      case 'email.opened':
        console.log(`[webhook] Email opened by ${event.data?.to}`);
        break;

      case 'email.clicked':
        console.log(`[webhook] Link clicked in email to ${event.data?.to}:`, event.data?.click?.url);
        break;

      default:
        console.log(`[webhook] Unknown event type: ${event.type}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[webhook] Error processing webhook:', error);
    // Still return 200 to prevent Resend from retrying
    res.status(200).json({ received: true, error: error.message });
  }
});

// GET /webhooks/resend/test - test endpoint to verify webhook is working
router.get('/resend/test', (req, res) => {
  res.json({ 
    message: 'Webhook endpoint is ready',
    secret_configured: !!process.env.RESEND_WEBHOOK_SECRET
  });
});

export default router;
