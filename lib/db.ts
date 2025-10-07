import { sql } from '@vercel/postgres';

export { sql };

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const result = await sql.query(text, params);
  return result;
}
