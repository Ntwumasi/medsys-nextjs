import { createPool } from '@vercel/postgres';

// Create a singleton pool with explicit configuration
const getPool = (() => {
  let pool: ReturnType<typeof createPool> | null = null;

  return () => {
    if (!pool) {
      // Use PRISMA_DATABASE_URL (pooled) or DATABASE_URL as fallback
      const connectionString = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

      if (!connectionString) {
        throw new Error('No database connection string found. Set PRISMA_DATABASE_URL or DATABASE_URL.');
      }

      pool = createPool({ connectionString });
    }
    return pool;
  };
})();

// Export sql from the pool
export const sql = new Proxy({} as ReturnType<typeof createPool>['sql'], {
  get(target, prop) {
    return getPool().sql[prop as keyof ReturnType<typeof createPool>['sql']];
  },
  apply(target, thisArg, args: unknown[]) {
    return (getPool().sql as Function)(...args);
  }
});

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const result = await getPool().query(text, params);
  return result;
}
