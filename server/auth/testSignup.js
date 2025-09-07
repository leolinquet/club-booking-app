// server/auth/testSignup.js
export function buildTestSignupRouter(db){
  const router = express.Router();

  router.post('/test-signup', (req, res) => {
    // Require secret to prevent public abuse
    if (req.get('x-test-signup-secret') !== process.env.TEST_SIGNUP_SECRET){
      return res.status(403).json({error:'Forbidden'});
    }
    const { display_name, password } = req.body || {};
    const pw = validatePassword(password || 'Aa123'); // or skip for test
    if (!pw.ok) return res.status(400).json({error: pw.error});

    const hash = bcrypt.hashSync(password, 10);
    const fakeEmail = `test_${Date.now()}@example.test`; // non-routable TLD
    const info = db.prepare(`
      INSERT INTO users (display_name, email, password_hash, is_test, email_verified_at)
      VALUES (?, ?, ?, 1, ?)
    `).run(display_name || 'Test User', fakeEmail, hash, new Date().toISOString());

    res.json({ok:true, user_id: info.lastInsertRowid});
  });

  return router;
}

const { ok, error, id } = await sendEmail({ to: email, subject: 'Verify your Club Booking email', html });
if (!ok) {
  return res.status(500).json({ error: 'Failed to send verification email', detail: error });
}

// server/server.js
import { buildTestSignupRouter } from './auth/testSignup.js';
app.use('/auth', buildTestSignupRouter(db));
