import db from '../db.js';
import { DateTime } from 'luxon';

(async ()=>{
  try {
    const bookingId = 23;
    const booking = await db.prepare('SELECT b.*, c.timezone AS club_tz, cs.slot_minutes FROM bookings b LEFT JOIN clubs c ON c.id = b.club_id LEFT JOIN club_sports cs ON cs.club_id = b.club_id AND cs.sport = ? WHERE b.id = ?').get('tennis', bookingId);
    if (!booking) {
      console.log('No booking with id', bookingId);
      process.exit(0);
    }

    const { id, club_id, user_id, starts_at, ends_at, club_tz, slot_minutes } = booking;
    const slotMinutes = slot_minutes ? Number(slot_minutes) : 60;

    const startsUtc = starts_at ? DateTime.fromJSDate(new Date(starts_at)).toUTC() : null;
    const endsUtc = ends_at ? DateTime.fromJSDate(new Date(ends_at)).toUTC() : null;

    const tz = club_tz || 'UTC';
    const startsLocal = startsUtc ? startsUtc.setZone(tz) : null;
    const endsLocal = endsUtc ? endsUtc.setZone(tz) : null;

    console.log('booking id:', id);
    console.log('club_id:', club_id);
    console.log('user_id:', user_id);
    console.log('slot_minutes:', slotMinutes);
    console.log('club timezone:', tz);
    console.log('starts_at (UTC):', startsUtc ? startsUtc.toISO() : null);
    console.log('ends_at   (UTC):', endsUtc ? endsUtc.toISO() : null);
    console.log('starts_at (local):', startsLocal ? startsLocal.toISO() : null);
    console.log('ends_at   (local):', endsLocal ? endsLocal.toISO() : null);
    console.log('raw booking row:', booking);
  } catch (e) {
    console.error('error', e && e.message ? e.message : e);
  }
  process.exit(0);
})();
