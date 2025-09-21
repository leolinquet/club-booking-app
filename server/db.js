import pg from 'pg';
const { Pool } = pg;

const { DATABASE_URL, FORCE_PG_SSL } = process.env;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Put it in server/.env');
  process.exit(1);
}
const useSSL = /sslmode=require/i.test(DATABASE_URL) || FORCE_PG_SSL === '1';
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

function toPg(sql){ let i=0; return String(sql).replace(/\?/g, () => `$${++i}`); }
function flat(args){ return (args.length===1 && Array.isArray(args[0])) ? args[0] : args; }

export function prepare(sql){
  return {
    async get(...args){ const { rows } = await pool.query(toPg(sql), flat(args)); return rows[0] || null; },
    async all(...args){ const { rows } = await pool.query(toPg(sql), flat(args)); return rows; },
    async run(...args){ const res = await pool.query(toPg(sql), flat(args)); return { changes: res.rowCount, lastID: res.rows?.[0]?.id ?? null }; },
  };
}

export async function get(sql, ...args){ return prepare(sql).get(...args); }
export async function all(sql, ...args){ return prepare(sql).all(...args); }
export async function run(sql, ...args){ return prepare(sql).run(...args); }

export async function tableExists(name){
  const { rows } = await pool.query(`SELECT to_regclass($1) AS reg`, [name]);
  return !!rows[0]?.reg;
}

export async function tableInfo(table){
  const { rows } = await pool.query(`
    SELECT column_name AS name, (is_nullable='NO')::int AS notnull
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$1
    ORDER BY ordinal_position
  `, [table]);
  return rows;
}

export const q   = (sql, ...args) => pool.query(toPg(sql), flat(args));
export const one = async (sql, ...args) => (await q(sql, ...args)).rows[0] || null;
export const exec = async (sql) => { if (String(sql).trim()) await pool.query(sql); };

export default { prepare, get, all, run, q, one, exec, tableInfo, tableExists, pool };
