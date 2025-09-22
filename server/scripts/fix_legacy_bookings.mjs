import 'dotenv/config';
import pg from 'pg';
import { DateTime } from 'luxon';

// Usage:
// PREV_TZ='America/Chicago' APPLY=0 node scripts/fix_legacy_bookings.mjs --limit=100
// PREV_TZ='America/Chicago' APPLY=1 node scripts/fix_legacy_bookings.mjs --limit=100

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function argVal(name, def) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  if (!arg) return def;
  return arg.split('=')[1];
}

(async ()=>{
  const previewOnly = !process.env.APPLY || Number(process.env.APPLY) === 0;
  const prevTz = process.env.PREV_TZ || 'America/Chicago';
  const limit = Number(argVal('limit', 100));

  console.log('fix_legacy_bookings: previewOnly=', previewOnly, 'prevTz=', prevTz, 'limit=', limit);

  try {
    // Select bookings that use starts_at (legacy). We will only touch rows
    // where the club has a timezone set (or fallback to DEFAULT_TIMEZONE).
    const rows = (await pool.query(`
      SELECT b.id, b.starts_at, b.ends_at, b.court_id, co.id AS club_id, co.timezone AS club_tz
      FROM bookings b
      JOIN courts c ON c.id = b.court_id
      JOIN clubs co ON co.id = c.club_id
      WHERE b.starts_at IS NOT NULL
      ORDER BY b.id DESC
      LIMIT $1
    `, [limit])).rows;

    console.log('Found', rows.length, 'legacy bookings to inspect');

    const ops = [];
    for (const r of rows) {
      const clubTz = r.club_tz || process.env.DEFAULT_TIMEZONE || 'UTC';

      // The buggy creation flow interpreted the client-provided local time in the
      // server's timezone (prevTz) and then stored the resulting instant. To
      // restore the intended club-local instant (same clock time but in clubTz),
      // we reverse that process.

      const stored = r.starts_at; // JS Date from driver
      if (!stored) continue;

      // Interpret stored instant as UTC instant, then represent it in prevTz
      const instUTC = DateTime.fromJSDate(stored, { zone: 'utc' });
      const asPrevLocal = instUTC.setZone(prevTz);

      // Build a new instant that has the same local wall-clock (year,month,day,hour,minute)
      // but interpreted in the club's timezone.
      const desiredLocal = DateTime.fromObject({
        year: asPrevLocal.year,
        month: asPrevLocal.month,
        day: asPrevLocal.day,
        hour: asPrevLocal.hour,
        minute: asPrevLocal.minute,
        second: asPrevLocal.second || 0,
      }, { zone: clubTz });

      const desiredUTC = desiredLocal.toUTC();
      const newStartsAtISO = desiredUTC.toISO();
      const newEndsAtISO = desiredUTC.plus({ hours: 1 }).toISO();

      const preview = {
        id: r.id,
        club_id: r.club_id,
        club_tz: clubTz,
        stored_instant: instUTC.toISO(),
        interpreted_as_prev_local: asPrevLocal.toISO(),
        desired_local_clock: desiredLocal.toISO(),
        new_starts_at_utc: newStartsAtISO,
        new_ends_at_utc: newEndsAtISO,
      };
      ops.push(preview);
    }

    console.log('Preview of corrections (first 20):', ops.slice(0,20));

    if (!previewOnly) {
      for (const o of ops) {
        console.log('Applying update for booking', o.id, '-> starts_at', o.new_starts_at_utc);
        await pool.query(`UPDATE bookings SET starts_at=$1, ends_at=$2 WHERE id=$3`, [o.new_starts_at_utc, o.new_ends_at_utc, o.id]);
      }
      console.log('Applied', ops.length, 'updates');
    } else {
      console.log('Preview mode - no DB changes. To apply, set environment APPLY=1 and re-run.');
    }
  } catch (e) {
    console.error('Error in fix_legacy_bookings:', e && e.stack ? e.stack : e);
  } finally {
    await pool.end();
  }
})();
