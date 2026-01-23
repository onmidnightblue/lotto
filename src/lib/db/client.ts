/**
 * Supabase/Postgres + Drizzle client
 *
 * - Reads DATABASE_URL from env (recommended for server-side only)
 * - Exports `db` (Drizzle) and `pgPool` (node-postgres Pool) for migrations/tools
 */

import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as dotenv from 'dotenv';

dotenv.config({path: '.env'});

const connectionString =
  process.env.DATABASE_URL ||
  ''

if (!connectionString) {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.warn(
      'DATABASE_URL not set. Build will continue but database features will not work.'
    )
  } else {
    throw new Error(
      'DATABASE_URL not set. Set DATABASE_URL to your Supabase Postgres connection string.'
    )
  }
}

const pool = connectionString
  ? new Pool({
      connectionString,
    })
  : ({} as Pool)

export const pgPool = pool
export const db = connectionString ? drizzle(pool as Pool) : ({} as ReturnType<typeof drizzle>)

export type PgPool = typeof pgPool

export default db
