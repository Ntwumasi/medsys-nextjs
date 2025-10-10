import type { VercelPool } from '@vercel/postgres';

let pool: VercelPool | undefined;

async function getPool() {
  if (!pool) {
    const { createPool } = await import('@vercel/postgres');
    pool = createPool({
      connectionString: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL,
    });
  }
  return pool;
}

// Export sql as async function wrapper
export const sql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const p = await getPool();
  return p.sql(strings, ...values);
};

// Make it callable as a tagged template
Object.assign(sql, {
  query: async (text: string, params?: unknown[]) => {
    const p = await getPool();
    return p.query(text, params);
  }
});

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const p = await getPool();
  return p.query(text, params);
}
