// db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'evoting_user',
  password: process.env.DB_PASSWORD || 'evoting_pass',
  database: process.env.DB_NAME || 'e_voting'
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
