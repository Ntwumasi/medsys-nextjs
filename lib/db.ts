import type { VercelPool } from '@vercel/postgres';

let pool: VercelPool | undefined;

async function getPool() {
  if (!pool) {
    const { createPool } = await import('@vercel/postgres');
    pool = createPool({
      connectionString: process.env.POSTGRES_PRISMA_URL,
    });
  }
  return pool;
}

// Export sql as async function wrapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
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
