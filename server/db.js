const pg = require('pg');

const pool = new pg.Pool({
  user: process.env.DB_USER || 'scout_user',
  password: process.env.DB_PASSWORD || 'scout_password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'scout_report',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Uncomment for query logging in development:
    // console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Database query error:', err, { text, params });
    throw err;
  }
}

async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getHealth() {
  try {
    await query('SELECT NOW()');
    return { status: 'healthy', database: 'connected' };
  } catch (err) {
    return { status: 'unhealthy', database: 'disconnected', error: err.message };
  }
}

module.exports = { query, transaction, getHealth, pool };
