const { Pool, types } = require('pg');

// Force node-postgres to return timestamps as proper UTC ISO strings
// Without this, timestamps come back as local-time strings (no Z suffix),
// causing the mobile to treat them as device-local time and double-shift by +5:30
types.setTypeParser(1114, (val) => {
  // TIMESTAMP WITHOUT TIME ZONE — treat as UTC
  return val ? new Date(val + 'Z').toISOString() : null;
});
types.setTypeParser(1184, (val) => {
  // TIMESTAMP WITH TIME ZONE — parse and re-emit as UTC ISO
  return val ? new Date(val).toISOString() : null;
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000, // Give Neon 10s to wake up if cold
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
