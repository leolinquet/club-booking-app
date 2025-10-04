#!/usr/bin/env node
import 'dotenv/config';
import db, { pool } from '../db.js';
import { DateTime } from 'luxon';

// Usage: node server/scripts/check_active_booking.mjs <userId> <clubId>
const [,, userIdArg, clubIdArg] = process.argv;
if (!userIdArg || !clubIdArg) {
  console.error('Usage: node server/scripts/check_active_booking.mjs <userId> <clubId>');
  process.exit(2);
}
const userId = Number(userIdArg);
const clubId = Number(clubIdArg);

async function main(){
  try {
    const bInfo = await db.tableInfo('bookings');
    const bCols = new Set((bInfo || []).map(c => c.name));
    console.log('Detected booking columns:', Array.from(bCols).join(','));

    if (bCols.has('date') && bCols.has('time')) {
      console.log('Running modern schema check');
      const q = `SELECT id, user_id, club_id, date, time, status,
        (to_timestamp(date || ' ' || time, 'YYYY-MM-DD HH24:MI') + interval '1 hour') AS end_at
        FROM bookings
        WHERE user_id = $1 AND club_id = $2
        ORDER BY end_at DESC LIMIT 10`;
      const { rows } = await pool.query(q, [userId, clubId]);
      console.log('Recent bookings for user/club:', rows);
      const nowRes = await pool.query('SELECT NOW() AS now');
      console.log('DB NOW():', nowRes.rows[0].now);
    } else if (bCols.has('starts_at')) {
      console.log('Running legacy schema check');
        // If clubId provided, show recent bookings for that club; otherwise show for the user.
        if (clubId) {
          const q = `SELECT id, user_id, club_id, court_id, starts_at, ends_at, (COALESCE(ends_at, starts_at + interval '1 hour')) AS end_at
            FROM bookings
            WHERE club_id = $1 AND (starts_at >= NOW() - interval '48 hours' OR ends_at >= NOW() - interval '48 hours')
            ORDER BY end_at DESC`;
          const { rows } = await pool.query(q, [clubId]);
          const nowRes = await pool.query('SELECT NOW() AS now');
          const now = nowRes.rows[0].now;
          const annotated = (rows || []).map(r => ({
            id: r.id,
            user_id: r.user_id,
            club_id: r.club_id,
            starts_at: r.starts_at,
            ends_at: r.ends_at,
            end_at: r.end_at,
            isActive: r.end_at ? (r.end_at > now) : false
          }));
          console.log('DB NOW():', now);
          console.log('Recent bookings for club (last 48h, annotated):', annotated);
        } else {
          const q = `SELECT id, user_id, starts_at, ends_at, (COALESCE(ends_at, starts_at + interval '1 hour')) AS end_at
            FROM bookings
            WHERE user_id = $1
            ORDER BY end_at DESC LIMIT 20`;
          const { rows } = await pool.query(q, [userId]);
          const nowRes = await pool.query('SELECT NOW() AS now');
          const now = nowRes.rows[0].now;
          console.log('DB NOW():', now);
          const annotated = (rows || []).map(r => ({
            id: r.id,
            starts_at: r.starts_at,
            ends_at: r.ends_at,
            end_at: r.end_at,
            isActive: r.end_at ? (r.end_at > now) : false
          }));
          console.log('Recent bookings for user (annotated):', annotated);
        }
    } else {
      console.log('Unknown bookings schema; cannot run debug check');
    }
  } catch (e) {
    console.error('Error', e && e.stack ? e.stack : e);
  } finally {
    await pool.end();
  }
}

main();
