import { sql as vercelSql } from '@vercel/postgres';

// Export sql directly - @vercel/postgres handles pooling internally
export const sql = vercelSql;

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const result = await sql.query(text, params);
  return result;
}
