import 'dotenv/config';
import pg from 'pg';
import { DateTime } from 'luxon';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
(async ()=>{
  try {
    const res = await pool.query(`
      SELECT b.id, b.court_id, b.starts_at, b.ends_at, b.user_id, u.username,
        c.id AS court_row_id, c.club_id AS court_club_id, c.sport AS court_sport,
        cl.id AS club_id, cl.timezone AS club_tz, cl.sport AS club_sport
      FROM bookings b
      LEFT JOIN courts c ON c.id = b.court_id
      LEFT JOIN clubs cl ON cl.id = COALESCE(c.club_id, b.club_id)
      LEFT JOIN users u ON u.id = b.user_id
      ORDER BY b.id DESC
      LIMIT 100`);

    console.log('Last', res.rows.length, 'bookings:');
    for (const r of res.rows) {
      const raw = r.starts_at;
      const rawStr = String(raw);
      const clubTz = r.club_tz || process.env.DEFAULT_TIMEZONE || 'UTC';
      let asUTC = null;
      if (raw == null) asUTC = null;
      else if (raw instanceof Date) asUTC = DateTime.fromJSDate(raw, { zone: 'utc' });
      else asUTC = DateTime.fromISO(rawStr, { zone: 'utc' });
      const local = asUTC && asUTC.isValid ? asUTC.setZone(clubTz) : null;

      console.log('\nID', r.id, 'user', r.username || r.user_id, 'club', r.club_id || r.court_club_id, 'club_tz', clubTz);
      console.log('  starts_at raw type:', typeof raw, 'value:', rawStr);
      console.log('  parsed UTC:', asUTC && asUTC.isValid ? asUTC.toISO() : 'invalid');
      console.log('  club-local:', local ? local.toISO() : 'invalid', 'time:', local ? local.toFormat('HH:mm') : null);
      console.log('  date/time fields:', r.b_date, r.b_time, 'court_id:', r.court_id, 'court_index:', r.court_index);
    }
  } catch (e) { console.error(e && e.stack ? e.stack : e); } finally { await pool.end(); }
})();
