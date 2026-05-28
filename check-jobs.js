const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  const r = await pool.query('SELECT id, created_at FROM public.jobs ORDER BY created_at DESC NULLS LAST');
  console.log('Count:', r.rows.length);
  r.rows.forEach(x => console.log(x.id, '::', x.created_at));
  await pool.end();
})();
