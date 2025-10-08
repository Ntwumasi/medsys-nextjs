import { createClient } from '@vercel/postgres';

let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!client) {
    client = createClient({
      connectionString: process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL,
    });
  }
  return client;
}

// Export sql as a tagged template function
export const sql = (...args: Parameters<ReturnType<typeof createClient>['sql']>) => {
  return getClient().sql(...args);
};

// Database helper functions
export async function query(text: string, params?: unknown[]) {
  const result = await getClient().query(text, params);
  return result;
}
