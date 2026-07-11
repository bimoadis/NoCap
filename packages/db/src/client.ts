import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

import path from 'path';
import fs from 'fs';

dotenv.config();
const workspaceEnv = path.resolve(process.cwd(), '.env');
const parentEnv = path.resolve(process.cwd(), '../../.env');
if (fs.existsSync(workspaceEnv)) {
  dotenv.config({ path: workspaceEnv });
} else if (fs.existsSync(parentEnv)) {
  dotenv.config({ path: parentEnv });
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  lookup: (hostname: string, options: any, callback: any) => {
    dns.lookup(hostname, { ...options, family: 4 }, callback);
  },
} as any);

export const db = drizzle(pool, { schema });
export * from './schema.js';
export { pool };
