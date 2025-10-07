import { createPool, sql as vercelSql } from '@vercel/postgres';
import type { VercelPool } from '@vercel/postgres';

let pool: VercelPool | null = null;

function getPool() {
  if (!pool) {
    pool = createPool({
      connectionString: process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL,
    });
  }
  return pool;
}

export const sql = new Proxy({} as typeof vercelSql, {
  get(target, prop) {
    return (getPool().sql as any)[prop];
  }
});

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const result = await getPool().query(text, params);
  return result;
}
