import db from '../db.js';

(async ()=>{
  try {
    const cfg = await db.prepare('SELECT slot_minutes FROM club_sports WHERE club_id = ? AND sport = ?').get(2,'tennis');
    console.log('slot_minutes:', cfg && cfg.slot_minutes);
    const mins = cfg && cfg.slot_minutes ? Number(cfg.slot_minutes) : 60;
    const q = `SELECT 1 AS one, id, user_id, starts_at, ends_at FROM bookings WHERE user_id = ? AND ((ends_at IS NOT NULL AND ends_at > NOW()) OR (ends_at IS NULL AND (starts_at + ($2 * interval '1 minute')) > NOW())) LIMIT 10`;
    const rows = await db.prepare(q).all(3, mins);
    console.log('active rows count:', rows.length);
    for (const r of rows) console.log(r);
  } catch (e) {
    console.error('err', e && e.message ? e.message : e);
  }
  process.exit(0);
})();
