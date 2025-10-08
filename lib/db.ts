import { sql as vercelSql } from '@vercel/postgres';

// Re-export sql directly from @vercel/postgres
// This avoids any initialization during build time
export const sql = vercelSql;

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const result = await sql.query(text, params);
  return result;
}
