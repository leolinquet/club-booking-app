// server/routes/email-debug.js
import express from 'express';
import { mailBackend, emailFrom } from '../email/resend.js';

const router = express.Router();

// Diagnostic endpoint to check email configuration
router.get('/email-config', (req, res) => {
  res.json({
    backend: mailBackend,
    emailFrom: emailFrom,
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendKeyPrefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 8) + '...' : 'not set',
    nodeEnv: process.env.NODE_ENV || 'not set',
    timestamp: new Date().toISOString()
  });
});

export default router;
