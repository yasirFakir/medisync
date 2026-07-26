const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Error: DATABASE_URL environment variable is not defined in .env file.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  // Target SQL file passed as optional CLI argument or default to seed.sql
  const targetFile = process.argv[2] || 'seed.sql';
  const seedSqlPath = path.join(__dirname, targetFile);

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();

    console.log(`Reading SQL seed file from: ${seedSqlPath}`);
    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');

    console.log('Executing seed queries...');
    await client.query(seedSql);

    console.log(`Database script (${targetFile}) executed successfully.`);
  } catch (err) {
    console.error(`Error executing ${targetFile}:`, err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
};

seedDatabase();
