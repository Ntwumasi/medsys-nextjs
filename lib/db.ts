import { createPool } from '@vercel/postgres';

let pool: ReturnType<typeof createPool> | null = null;

function getPool() {
  if (!pool) {
    pool = createPool({
      connectionString: process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL,
    });
  }
  return pool;
}

// Export sql directly from pool
export const sql = getPool().sql;

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const result = await getPool().query(text, params);
  return result;
}
