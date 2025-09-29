import { Pool } from 'pg';

const API = 'http://localhost:5051';
const DB = process.env.DATABASE_URL || 'postgres://leolopez-linquet@localhost:5432/clubbooking_local';

async function main() {
  const pool = new Pool({ connectionString: DB });
  try {
    // 1) call API to add leolinquet to tournament 5 as manager 2
    const resp = await global.fetch(`${API}/tournaments/5/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: ['leolinquet'], managerId: 2 })
    });
    const body = await resp.json();
    console.log('API response:', JSON.stringify(body));

    // 2) fetch user row
    const userRes = await pool.query("SELECT id, username, display_name FROM users WHERE LOWER(username)=LOWER($1) OR LOWER(display_name)=LOWER($1) LIMIT 1", ['leolinquet']);
    const user = userRes.rows[0];
    if (!user) throw new Error('user leolinquet not found');

    // 3) fetch players row for this club (2)
    const pRes = await pool.query('SELECT id, user_id, display_name FROM players WHERE club_id=$1 AND user_id=$2', [2, user.id]);
    if (!pRes.rows.length) throw new Error('players row not found for club 2 user ' + user.id);
    const p = pRes.rows[0];

    console.log('db user:', user);
    console.log('db player:', p);

    if (String(user.display_name || user.username) === String(p.display_name)) {
      console.log('PASS: players.display_name matches users.display_name');
      process.exit(0);
    } else {
      console.error('FAIL: mismatch — user.display_name=', user.display_name, 'player.display_name=', p.display_name);
      process.exit(2);
    }
  } catch (e) {
    console.error('ERROR in regression script:', e && e.message ? e.message : e);
    process.exit(3);
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

main();
