import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
(async ()=>{
  try {
    const clubId = 9;
    const sport = 'tennis';
    const clubSportRow = await pool.query('SELECT sport FROM clubs WHERE id=$1',[clubId]);
    const clubDefaultSport = clubSportRow.rows?.[0] ? String(clubSportRow.rows[0].sport || '').toLowerCase() : '';
    const includeLegacyNull = (String(sport).toLowerCase() === clubDefaultSport);
    const courtsFilterCond = `c2.club_id = $1 AND (c2.sport = $2 ${includeLegacyNull ? 'OR c2.sport IS NULL' : ''})`;
    const sql = `WITH courts_ordered AS (
      SELECT id, (row_number() OVER (ORDER BY id) - 1) AS court_index
      FROM courts c2
      WHERE ${courtsFilterCond}
      ORDER BY id
    )
    SELECT b.id, co.court_index, b.starts_at, b.user_id
    FROM bookings b
    JOIN courts_ordered co ON co.id = b.court_id`;
    console.log('SQL:',sql);
    const res = await pool.query(sql, [clubId, sport]);
    console.log('rows:', res.rows);
  } catch (e) { console.error(e);} finally { await pool.end(); }
})();
