import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './database';
import { getDatabaseUrl } from './env';

/**
 * Database client for Neon Postgres
 * Uses HTTP driver for Vercel serverless compatibility
 *
 * Import as: import { db } from '@/lib/db'
 */
const sql = neon(getDatabaseUrl());
export const db = drizzle({ client: sql, schema });
