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

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();

    const seedSqlPath = path.join(__dirname, 'seed.sql');
    console.log(`Reading SQL seed file from: ${seedSqlPath}`);
    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');

    console.log('Executing seed queries...');
    await client.query(seedSql);

    console.log('Database seeded successfully.');
  } catch (err) {
    console.error('Error during database seeding:', err.message || err);
    console.error('\n💡 Tip: If running inside Docker, make sure PostgreSQL is accessible or run:');
    console.error('   sudo docker exec -i medisync-db psql -U postgres -d medisync_db < database/seed.sql');
    process.exit(1);
  } finally {
    await client.end();
  }
};

seedDatabase();
