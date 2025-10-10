import { createPool } from '@vercel/postgres';

// Create pool with explicit pooled connection
const pool = createPool({
  connectionString: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL,
});

// Export the pool's sql directly
export const { sql } = pool;

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const result = await pool.query(text, params);
  return result;
}
