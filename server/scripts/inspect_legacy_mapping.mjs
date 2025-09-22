import 'dotenv/config';
import pg from 'pg';
import { DateTime } from 'luxon';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
(async ()=>{
  try {
    const clubId = Number(process.argv[2] || 9);
    const sport = String(process.argv[3] || 'tennis').toLowerCase();
    const date = String(process.argv[4] || '2000-01-01');

    const clubRes = await pool.query('SELECT sport, timezone FROM clubs WHERE id=$1', [clubId]);
    const clubRow = clubRes.rows?.[0] || {};
    const clubDefaultSport = clubRow.sport ? String(clubRow.sport).toLowerCase() : '';
    const includeLegacyNull = (sport === clubDefaultSport);
    const clubTz = clubRow.timezone || process.env.DEFAULT_TIMEZONE || 'UTC';

    const courtsFilterCond = `c2.club_id = $1 AND (c2.sport = $2 ${includeLegacyNull ? 'OR c2.sport IS NULL' : ''})`;
    const sql = `WITH courts_ordered AS (
      SELECT id, (row_number() OVER (ORDER BY id) - 1) AS court_index
      FROM courts c2
      WHERE ${courtsFilterCond}
      ORDER BY id
    )
    SELECT b.id, co.court_index, b.starts_at, b.user_id, b.ends_at
    FROM bookings b
    JOIN courts_ordered co ON co.id = b.court_id`;

    console.log('Running mapping inspection for', { clubId, sport, date, clubTz, includeLegacyNull });
    const res = await pool.query(sql, [clubId, sport]);
    console.log('Raw rows count:', res.rows.length);
    for (const r of res.rows) {
      console.log('\n--- row id', r.id, 'court_index', r.court_index, 'user_id', r.user_id, '---');
      console.log('starts_at raw (driver value):', r.starts_at, 'typeof:', typeof r.starts_at);
      console.log('String(starts_at):', String(r.starts_at));

      // Try parsing both as ISO and as JS Date
      try {
        const fromISO = DateTime.fromISO(String(r.starts_at), { zone: 'utc' });
        const fromJS = r.starts_at instanceof Date ? DateTime.fromJSDate(r.starts_at, { zone: 'utc' }) : null;
        console.log('fromISO valid:', fromISO.isValid, 'iso:', fromISO.toISO());
        if (fromJS) console.log('fromJS valid:', fromJS.isValid, 'iso:', fromJS.toISO());

        const dt = (fromJS && fromJS.isValid) ? fromJS.setZone(clubTz) : fromISO.setZone(clubTz);
        console.log('club-local ISO:', dt.toISO(), 'club-local date:', dt.toISODate(), 'time:', dt.toFormat('HH:mm'));
        const matchesDate = dt.toISODate() === date;
        console.log('matches requested date?', { requestedDate: date, matchesDate });
      } catch (e) {
        console.error('parse error', e && e.stack ? e.stack : e);
      }
    }
  } catch (e) {
    console.error(e && e.stack ? e.stack : e);
  } finally {
    await pool.end();
  }
})();
