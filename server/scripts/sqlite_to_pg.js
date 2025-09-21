// scripts/sqlite_to_pg.js
import Database from 'better-sqlite3'
import pg from 'pg'

const SQLITE_PATH = 'server/data.db'            // run from project root
const PG_URL = process.env.PG_URL || process.env.DATABASE_URL
if (!PG_URL) { console.error('Set PG_URL or DATABASE_URL'); process.exit(1) }

const PREFERRED_ORDER = [
  'club_sports','clubs','users','courts',
  'tournaments','standings','tournament_players','matches',
  // tournament_points is skipped if it lacks player_id in sqlite
  'tournament_points',
  'club_members',
  'bookings'
]

const pool = new pg.Pool({ connectionString: PG_URL, ssl: { rejectUnauthorized: false } })
const sqlite = new Database(SQLITE_PATH, { readonly: true })

/* ---------- helpers about sqlite & pg schema ---------- */
function sqliteHasTable(name){
  return !!sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name)
}
function sqliteTableColumns(name){
  try { return sqlite.prepare(`PRAGMA table_info("${name}")`).all().map(c=>c.name) } catch { return [] }
}
async function getPgCols(){
  const res = await pool.query(`
    SELECT table_name, column_name, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public'
    ORDER BY table_name, ordinal_position`)
  const byTable = {}
  for (const r of res.rows) (byTable[r.table_name] ||= []).push(r)
  return byTable
}
async function getPkCols(table){
  const { rows } = await pool.query(`
    SELECT a.attname AS col
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid=i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = $1::regclass AND i.indisprimary`, [table])
  return rows.map(r=>r.col)
}

/* ---------- court resolve / create-on-demand ---------- */
async function ensureDefaultClubId(){
  const { rows } = await pool.query(`SELECT id FROM clubs ORDER BY id LIMIT 1`)
  if (rows.length) return rows[0].id
  // if no clubs, create a placeholder
  const ins = await pool.query(`INSERT INTO clubs (name, code) VALUES ('Default Club','DEF') RETURNING id`)
  return ins.rows[0].id
}
async function ensureCourtByLabel(label){
  if (label == null || label === '') return null
  // try by name or code
  let r = await pool.query(`SELECT id FROM courts WHERE name = $1 OR code = $1 LIMIT 1`, [label])
  if (r.rows.length) return r.rows[0].id
  const clubId = await ensureDefaultClubId()
  // create minimal court; add columns only if they exist
  let cols = ['name','club_id'], vals = ['$1','$2'], args = [label, clubId]
  // optional columns if present
  const { rows: opt } = await pool.query(`
     SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='courts' AND column_name IN ('code','sport')`)
  const want = new Set(opt.map(o=>o.column_name))
  if (want.has('code')) { cols.push('code'); vals.push('$3'); args.push(String(label).toLowerCase().replace(/\s+/g,'_').slice(0,32)) }
  if (want.has('sport')) { cols.push('sport'); vals.push('$'+(args.length+1)); args.push(String(label).toLowerCase()) }
  const sql = `INSERT INTO courts (${cols.join(',')}) VALUES (${vals.join(',')}) RETURNING id`
  r = await pool.query(sql, args)
  return r.rows[0].id
}

/* ---------- row transforms ---------- */
function fallbackDisplayName(src){
  const nameKeys = ['display_name','username','user_name','name']
  const emailKeys = ['email','mail']
  for (const k of nameKeys) if (src[k]) return String(src[k])
  for (const k of emailKeys) if (src[k]) return String(src[k]).split('@')[0]
  return src.id != null ? `User ${src.id}` : 'User'
}
function fallbackEmail(src, taken){
  const base = (src.email && String(src.email).includes('@'))
    ? String(src.email).trim()
    : ((src.username || `user${src.id || ''}`) + '@example.local').replace(/\s+/g,'')
  if (!taken.has(base)) { taken.add(base); return base }
  // make unique
  let i = 1, v = base
  const [local, domain] = base.split('@')
  while (taken.has(v)) { v = `${local}+${i}@${domain}`; i++ }
  taken.add(v)
  return v
}
function numericOrNull(v){ if (v===null || v===undefined || v==='') return null; const n=Number(v); return Number.isNaN(n)?null:n }

function transformRow(table, row, helpers){
  const r = { ...row }

  if (table === 'users'){
    if (!r.display_name || r.display_name==='') r.display_name = fallbackDisplayName(r)
    if (!r.email || String(r.email).trim()==='') r.email = fallbackEmail(r, helpers.takenEmails)
  }

  if (table === 'matches'){
    for (const k of ['p1_score','p2_score','winner_id','p1_id','p2_id','tournament_id']) {
      if (k in r) r[k] = numericOrNull(r[k])
    }
  }

  if (table === 'bookings'){
    // court_id may be text like 'padel' → map/create court row
    if (r.court_id === '' || r.court_id == null){
      r.court_id = helpers.defaultCourtId
    } else {
      const n = Number(r.court_id)
      r.court_id = Number.isNaN(n) ? helpers.ensureCourtSync(String(r.court_id)) : n
    }
  }

  // normalize empty strings to null
  for (const k of Object.keys(r)) if (r[k] === '') r[k] = null
  return r
}

/* ---------- upsert logic (handles composite PK) ---------- */
async function upsertTable(t, pgCols, helpers){
  if (!sqliteHasTable(t)) { console.log(`skip ${t} (not in sqlite)`); return }

  // special skip: tournament_points without player_id in sqlite
  if (t === 'tournament_points' && !sqliteTableColumns(t).includes('player_id')) {
    console.log('skip tournament_points (no player_id in sqlite)'); return
  }

  const rows = sqlite.prepare(`SELECT * FROM "${t}"`).all()
  if (!rows.length) { console.log(`skip ${t} (no rows)`); return }

  const pgMeta = pgCols[t] || []
  if (!pgMeta.length) { console.log(`skip ${t} (no PG table)`); return }

  const colsPg = pgMeta.map(c => c.column_name)
  const rowCols = sqliteTableColumns(t)
  const hasId  = rowCols.includes('id') && colsPg.includes('id')

  // base intersection (skip id for now)
  const base = colsPg.filter(c => rowCols.includes(c) && c !== 'id')

  // ensure users.display_name / email exist even if not in sqlite
  const extras = []
  if (t === 'users'){
    if (colsPg.includes('display_name') && !base.includes('display_name')) extras.push('display_name')
    if (colsPg.includes('email') && !base.includes('email')) extras.push('email')
  }

  const insertCols = hasId ? ['id', ...base, ...extras] : [...base, ...extras]

  // build conflict target
  let conflictCols = []
  if (hasId) conflictCols = ['id']
  else {
    const pk = await getPkCols(t)
    if (pk.length) conflictCols = pk
  }

  const placeholders = insertCols.map((_,i)=>`$${i+1}`).join(',')
  const updates = base.concat(extras).map(c=>`${c}=EXCLUDED.${c}`).join(',')
  const conflict = conflictCols.length
      ? `ON CONFLICT (${conflictCols.map(c=>`"${c}"`).join(',')}) DO UPDATE SET ${updates}`
      : '' // if no PK, let it insert (rare)

  const sql = `INSERT INTO "${t}" (${insertCols.map(c=>`"${c}"`).join(',')})
               VALUES (${placeholders})
               ${conflict}`

  const client = await pool.connect()
  let ok=0, bad=0
  try{
    await client.query('BEGIN')
    for (const src of rows){
      const row = transformRow(t, src, helpers)
      const vals = insertCols.map(c => (row[c] === undefined ? null : row[c]))
      try{
        await client.query(sql, vals)
        if (t==='users' && row.email) helpers.takenEmails.add(String(row.email))
        ok++
      }catch(e){
        bad++; if (bad<=12) console.warn(`${t}: id=${row.id ?? 'n/a'} -> ${e.code || ''} ${e.message}`)
      }
    }
    await client.query('COMMIT')
    console.log(`${t}: upserted=${ok}, skipped=${bad}`)
  }catch(e){
    await client.query('ROLLBACK'); console.error(`${t}: failed -> ${e.message}`)
  }finally{ client.release() }
}

/* ---------- sequence fixer ---------- */
async function fixSequences(){
  await pool.query(`
  DO $$
  DECLARE r record; seq text;
  BEGIN
    FOR r IN
      SELECT n.nspname AS schema, c.relname AS tbl, a.attname AS col
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE a.attnum > 0 AND NOT a.attisdropped
    LOOP
      EXECUTE format('SELECT pg_get_serial_sequence(%L,%L)', r.schema||'.'||r.tbl, r.col) INTO seq;
      IF seq IS NOT NULL THEN
        EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I.%I), 1))', seq, r.col, r.schema, r.tbl);
      END IF;
    END LOOP;
  END
  $$;`)
}

/* ---------- main ---------- */
async function main(){
  console.log('Connecting…')
  await pool.query('SELECT 1')

  const pgCols = await getPgCols()

  // ordered table list: prefer PREFERRED_ORDER then others present in sqlite
  const sqliteTables = sqlite.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY 1"
  ).all().map(r=>r.name)
  const ordered = []
  for (const t of PREFERRED_ORDER) if (sqliteTables.includes(t)) ordered.push(t)
  for (const t of sqliteTables) if (!ordered.includes(t)) ordered.push(t)

  // helpers
  const takenEmails = new Set((await pool.query(`SELECT email FROM users`)).rows.map(r=>r.email).filter(Boolean))

  // court resolver with caching + sync wrapper for transform
  const courtCache = new Map()
  async function ensureCourt(label){
    if (!label) return null
    if (courtCache.has(label)) return courtCache.get(label)
    const id = await ensureCourtByLabel(label)
    courtCache.set(label, id)
    return id
  }
  // sync facade for transform (blocks with deasync-like pattern using Atomics)
  function ensureCourtSync(label){
    let done=false, id=null, err=null
    ensureCourt(label).then(v=>{id=v; done=true}).catch(e=>{err=e; done=true})
    // tiny spin-wait; rows are few
    const start = Date.now()
    while(!done){
      if (Date.now()-start>5000) { throw new Error('ensureCourt timeout') }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5)
    }
    if (err) throw err
    return id
  }

  const helpers = { takenEmails, ensureCourtSync }

  // run
  for (const t of ordered) await upsertTable(t, pgCols, helpers)

  await fixSequences()
  await pool.end()
  sqlite.close()
  console.log('Done ✔')
}

main().catch(e=>{ console.error(e); process.exit(1) })
