import 'dotenv/config';
import pg from 'pg';
import { DateTime } from 'luxon';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

(async ()=>{
  try {
    const clubId = 5;
    const clubRes = await pool.query('SELECT id, name, timezone FROM clubs WHERE id=$1', [clubId]);
    const club = clubRes.rows[0];
    console.log('club:', club);
    const res = await pool.query('SELECT id, court_id, starts_at, ends_at, user_id FROM bookings WHERE club_id=$1 ORDER BY id DESC LIMIT 20', [clubId]);
    for (const r of res.rows) {
      const starts = r.starts_at ? DateTime.fromJSDate(new Date(r.starts_at)).toUTC().toISO() : null;
      console.log({ id: r.id, court_id: r.court_id, starts_at_raw: r.starts_at, starts_iso_utc: starts });
      if (starts) {
        const tz = club?.timezone || process.env.DEFAULT_TIMEZONE || 'UTC';
        const local = DateTime.fromISO(starts, { zone: 'utc' }).setZone(tz);
        console.log('  -> club-local:', tz, local.toISO(), local.toFormat('yyyy-MM-dd HH:mm'));
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();
