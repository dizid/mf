import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// For build time, we need a dummy connection that won't be used
// Pages using db should have `export const dynamic = 'force-dynamic'`
const connectionString = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost/dummy'
const sql = neon(connectionString)
export const db = drizzle(sql, { schema })

export * from './schema'
