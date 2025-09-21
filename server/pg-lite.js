// server/pg-lite.js
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Replace each "?" with "$1, $2, ..." for Postgres
function toPgParams(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}
function flattenArgs(args) {
  // support .get(a,b,c) and .get([a,b,c])
  if (args.length === 1 && Array.isArray(args[0])) return args[0];
  return Array.from(args);
}
function hasReturning(sql) { return /\breturning\b/i.test(sql); }
function isInsert(sql) { return /^\s*insert\b/i.test(sql); }

function prepareWithClient(client, rawSql) {
  const text = toPgParams(rawSql);

  return {
    async get(...args) {
      const values = flattenArgs(args);
      const r = await client.query(text, values);
      return r.rows[0];
    },
    async all(...args) {
      const values = flattenArgs(args);
      const r = await client.query(text, values);
      return r.rows;
    },
    async run(...args) {
      const values = flattenArgs(args);
      let q = text;
      let expectId = false;

      // emulate lastInsertRowid if caller didn’t specify RETURNING
      if (isInsert(rawSql) && !hasReturning(rawSql)) {
        q = text + ' RETURNING id';
        expectId = true;
      }
      const r = await client.query(q, values);
      return {
        changes: r.rowCount ?? 0,
        lastInsertRowid: expectId ? r.rows?.[0]?.id ?? null : null
      };
    }
  };
}

const db = {
  // mimic better-sqlite3: db.prepare(sql).get/all/run
  prepare(sql) {
    return prepareWithClient(pool, sql);
  },

  // optional raw exec (migrations/seeds)
  async exec(sql) {
    await pool.query(sql);
  },

  // transaction helper similar to better-sqlite3
  transaction(fn) {
    return async (...args) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const txDb = {
          prepare: (sql) => prepareWithClient(client, sql),
          exec: async (sql) => client.query(sql)
        };
        const out = await fn(txDb, ...args);
        await client.query('COMMIT');
        return out;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    };
  }
};

export default db;
export { pool }; // named export if you need it elsewhere
