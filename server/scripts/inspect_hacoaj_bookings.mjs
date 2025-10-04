import db from '../db.js';
import { DateTime } from 'luxon';

(async ()=>{
  try {
    const rows = await db.prepare('SELECT id, user_id, starts_at, ends_at, court_id FROM bookings WHERE club_id = ? ORDER BY starts_at DESC').all(2);
    console.log('count', rows.length);
    for (const r of rows) {
      const s = r.starts_at ? DateTime.fromISO(r.starts_at.toISOString(), { zone: 'utc' }).setZone('America/Chicago') : null;
      const e = r.ends_at ? DateTime.fromISO(r.ends_at.toISOString(), { zone: 'utc' }).setZone('America/Chicago') : null;
      console.log(JSON.stringify({ id: r.id, user_id: r.user_id, starts_at_utc: r.starts_at, starts_local: s? s.toISO() : null, ends_local: e? e.toISO(): null }));
    }
  } catch (e) {
    console.error('err', e && e.message ? e.message : e);
  }
  process.exit(0);
})();
