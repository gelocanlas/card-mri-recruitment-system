const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  const r = await pool.query('SELECT jsonb_build_object(\'id\', id, \'title\', title, \'is_active\', is_active) FROM public.jobs WHERE id LIKE \'job-%\' AND id NOT LIKE \'job-bmf%\' AND id NOT LIKE \'job-fin%\' AND id NOT LIKE \'job-it%\' AND id NOT LIKE \'job-hr%\'');
  console.log(JSON.stringify(r.rows.map(x => x.jsonb_build_object), null, 2));
  await pool.end();
})();
