import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') });
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();
