const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const resetDatabase = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Error: DATABASE_URL environment variable is not defined in .env file.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Connecting to PostgreSQL database for reset...');
    await client.connect();

    console.log('⚠️  Dropping all existing database tables, types, and schemas (clean reset)...');
    await client.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);

    const initSqlPath = path.join(__dirname, 'init.sql');
    console.log(`📜 Applying fresh schema from: ${initSqlPath}`);
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    await client.query(initSql);

    console.log('✅ Database schema reset and initialized successfully!');
  } catch (err) {
    console.error('❌ Error during database reset:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
};

resetDatabase();
