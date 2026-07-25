const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const initDatabase = async () => {
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
    console.log('Connecting to PostgreSQL database...');
    await client.connect();

    const initSqlPath = path.join(__dirname, 'init.sql');
    console.log(`Reading SQL init file from: ${initSqlPath}`);
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    console.log('Executing schema initialization...');
    await client.query(initSql);

    console.log('Database schema initialized successfully.');
  } catch (err) {
    console.error('Error during database initialization:', err.message || err);
    console.error('\n💡 Tip: If running inside Docker, make sure PostgreSQL is accessible or run:');
    console.error('   sudo docker exec -i medisync-db psql -U postgres -d medisync_db < database/init.sql');
    process.exit(1);
  } finally {
    await client.end();
  }
};

initDatabase();
