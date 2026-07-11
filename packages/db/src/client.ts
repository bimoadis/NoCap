import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

dotenv.config();
dotenv.config({ path: '../../.env' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  lookup: (hostname: string, options: any, callback: any) => {
    dns.lookup(hostname, { ...options, family: 4 }, callback);
  },
} as any);

export const db = drizzle(pool, { schema });
export * from './schema.js';
export { pool };
