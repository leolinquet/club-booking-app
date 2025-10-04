import db from '../db.js';

(async ()=>{
  try {
    const club = await db.prepare('SELECT id,name,timezone FROM clubs WHERE LOWER(name)=LOWER(?)').get('Hacoaj');
    console.log('club:', club);
    if (!club) return;
    const clubId = club.id;
    const rows = await db.prepare('SELECT id,club_id,user_id,starts_at,ends_at,court_id FROM bookings WHERE club_id = ? ORDER BY starts_at DESC LIMIT 200').all(clubId);
    console.log('found', rows.length, 'bookings for club', clubId);
    for (const r of rows) console.log(JSON.stringify(r));
  } catch (e) {
    console.error('err', e && e.message ? e.message : e);
  }
  process.exit(0);
})();
