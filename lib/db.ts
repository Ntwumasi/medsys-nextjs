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

// Lazy getter for sql - only initializes when accessed at runtime
export const sql = {
  query: (...args: Parameters<ReturnType<typeof createPool>['sql']['query']>) => {
    return getPool().sql.query(...args);
  }
} as ReturnType<typeof createPool>['sql'];

// Add template literal support
Object.assign(sql, new Proxy(() => {}, {
  apply: (target, thisArg, args) => {
    return getPool().sql(...args);
  }
}));

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const result = await getPool().query(text, params);
  return result;
}
