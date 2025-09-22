import 'dotenv/config';
import pg from 'pg';

const API = 'http://localhost:5051';
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');
const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function findUser(username){
  const r = await pool.query('SELECT id, username FROM users WHERE LOWER(username)=LOWER($1) LIMIT 1', [username]);
  return r.rows[0] || null;
}
async function findClubByName(name){
  const r = await pool.query('SELECT id, name, timezone FROM clubs WHERE name=$1 LIMIT 1', [name]);
  return r.rows[0] || null;
}

(async ()=>{
  try {
    const user = await findUser('leolinquet');
    console.log('user:', user);
    if (!user) throw new Error('user not found');
    const club = await findClubByName('MDQ');
    console.log('club:', club);
    if (!club) throw new Error('club not found');

    // Use a clearly past date
    const payload = {
      clubId: club.id,
      sport: 'tennis',
      courtIndex: 0,
      date: '2000-01-01',
      time: '09:00',
      userId: user.id
    };
    console.log('POST /book payload:', payload);
    const r = await fetch(`${API}/book`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const data = await r.json().catch(()=>null);
    console.log('book response status', r.status, 'body', data);

    // If booking succeeded, search for the created booking row and delete it
    if (r.ok) {
      // find recent booking by user on that date
      const br = await pool.query('SELECT id FROM bookings WHERE user_id=$1 AND club_id=$2 AND date=$3 AND time=$4 ORDER BY id DESC LIMIT 1', [user.id, club.id, payload.date, payload.time]);
      const bid = br.rows[0]?.id;
      console.log('created booking id:', bid);
      if (bid) {
        // cancel via API (simulate owner cancellation)
        const cr = await fetch(`${API}/cancel`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ bookingId: bid, userId: user.id }) });
        const cd = await cr.json().catch(()=>null);
        console.log('cancel response', cr.status, cd);
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('test failed', e);
    process.exit(2);
  } finally {
    await pool.end();
  }
})();
