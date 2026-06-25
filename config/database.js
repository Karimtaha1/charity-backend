const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'ENG-KARIM\SQLEXPRESS',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'karim',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === 'true',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

async function connectDB() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log(`✅ Connected to SQL Server - ${config.database}`);

      pool.on('error', err => {
        console.error('SQL Pool Error:', err);
        pool = null;
      });
    }
    return pool;
  } catch (err) {
    console.error('❌ Database Connection Failed:', err.message);
    throw err;
  }
}

async function getPool() {
  if (!pool) {
    await connectDB();
  }
  try {
    await pool.request().query('SELECT 1');
  } catch (err) {
    console.log('Pool unhealthy, reconnecting...');
    pool = null;
    await connectDB();
  }
  return pool;
}

async function closeDB() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Database connection closed');
  }
}

async function testConnection() {
  try {
    const testPool = await sql.connect(config);
    const result = await testPool.request().query('SELECT 1 as test');
    await testPool.close();
    return true;
  } catch (err) {
    console.error('❌ SQL Server connection test failed!');
    return false;
  }
}

module.exports = { sql, connectDB, getPool, closeDB, testConnection };
