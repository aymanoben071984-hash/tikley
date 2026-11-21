import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Database client.
 *
 * - Connects lazily on first use, so `next build` works without a database
 *   (important on Vercel, where routes are analysed at build time).
 * - Accepts DATABASE_URL, or POSTGRES_URL as set by Vercel / Neon integrations.
 * - Uses a small pool on serverless (Vercel) to stay under Postgres connection limits.
 */

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || undefined;
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

function createPool(): Pool {
  const connectionString = databaseUrl();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your PostgreSQL connection string (e.g. from Neon) in your environment — on Vercel: Project → Settings → Environment Variables.",
    );
  }
  const pool = new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX) || (isServerless ? 5 : 10),
    idleTimeoutMillis: isServerless ? 10_000 : 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: isServerless,
  });
  // A dropped idle connection must not crash the function.
  pool.on("error", (err) => console.error("PostgreSQL pool error:", err.message));
  return pool;
}

const createDb = (pool: Pool) => drizzle(pool);
type Database = ReturnType<typeof createDb>;

const globalForDb = globalThis as typeof globalThis & {
  __olPool?: Pool;
  __olDb?: Database;
};

/** The shared pg Pool (created on first use, reused across warm invocations). */
export function getPool(): Pool {
  if (!globalForDb.__olPool) globalForDb.__olPool = createPool();
  return globalForDb.__olPool;
}

function getDb(): Database {
  if (!globalForDb.__olDb) globalForDb.__olDb = createDb(getPool());
  return globalForDb.__olDb;
}

/** Drizzle client. Same API as before; the connection is opened on first query. */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

/**
 * Run `fn` while holding a Postgres advisory lock, so first-run seeding can't
 * happen twice when several serverless instances start at the same time.
 */
export async function withAdvisoryLock<T>(key: number, fn: () => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [key]);
    return await fn();
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [key]);
    } catch {
      /* the lock is released anyway when the session ends */
    }
    client.release();
  }
}

export const LOCK_SEED = 740_001;
export const LOCK_TOP_BOARDS = 740_002;
export const LOCK_GIFT_ACTIONS = 740_003;
