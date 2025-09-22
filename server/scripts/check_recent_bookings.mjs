import 'dotenv/config';
import pg from 'pg';
import { DateTime } from 'luxon';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
(async ()=>{
  try {
    const clubId = Number(process.argv[2] || 1);
    const courtIndex = process.argv[3] ? Number(process.argv[3]) : null;

    const sql = `SELECT b.id, b.court_id, b.starts_at, b.ends_at, b.user_id, u.username, c.id as court_id2, c.club_id as court_club_id, c.sport as court_sport, co.timezone as club_tz
      FROM bookings b
      LEFT JOIN courts c ON c.id = b.court_id
      LEFT JOIN clubs co ON co.id = CASE WHEN c.club_id IS NOT NULL THEN c.club_id ELSE b.club_id END
      LEFT JOIN users u ON u.id = b.user_id
      WHERE (co.id = $1 OR b.club_id = $1)
      ORDER BY b.id DESC
      LIMIT 50`;

    const res = await pool.query(sql, [clubId]);
    console.log('Inspecting recent bookings for club', clubId);
    for (const r of res.rows) {
      const raw = r.starts_at;
      const rawStr = String(raw);
      const asDate = raw instanceof Date ? DateTime.fromJSDate(raw, { zone: 'utc' }) : DateTime.fromISO(rawStr, { zone: 'utc' });
      const clubTz = r.club_tz || process.env.DEFAULT_TIMEZONE || 'UTC';
      const local = asDate.isValid ? asDate.setZone(clubTz) : null;
      console.log('\nbooking', r.id, 'court_id', r.court_id, 'user', r.username || r.user_id);
      console.log('  starts_at raw type:', typeof raw, 'value:', rawStr);
      console.log('  UTC iso:', asDate.isValid ? asDate.toISO() : 'invalid');
      console.log('  club tz:', clubTz, 'club-local:', local ? local.toISO() : 'invalid', 'time:', local ? local.toFormat('HH:mm') : null);
      console.log('  date/time columns:', r.date, r.time);
    }
  } catch (e) { console.error(e && e.stack ? e.stack : e); } finally { await pool.end(); }
})();
