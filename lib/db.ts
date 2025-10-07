import { createPool } from '@vercel/postgres';

// Use pooled connection for better performance
const pool = createPool({
  connectionString: process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL,
});

export const sql = pool.sql;

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const result = await pool.query(text, params);
  return result;
}
