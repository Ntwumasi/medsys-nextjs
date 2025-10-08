import { createClient } from '@vercel/postgres';

// Create a client with the pooled connection string
const client = createClient({
  connectionString: process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL,
});

// Export the sql template function
export const sql = client.sql;

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const result = await client.query(text, params);
  return result;
}
