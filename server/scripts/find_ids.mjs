import 'dotenv/config';
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(2);
}

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
    const club = await findClubByName('Hacoaj');
    console.log('club:', club);
    process.exit(0);
  } catch (e) {
    console.error('error', e);
    process.exit(2);
  } finally {
    await pool.end();
  }
})();
