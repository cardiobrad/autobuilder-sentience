import { Pool } from 'pg';

// Holds the active connection pool
let pool: Pool | null = null;

// The db object wrapper that initializes the pool only when needed
export const db = {
  query: async (text: string, params?: any[]) => {
    // If pool doesn't exist, create it (Lazy Loading)
    if (!pool) {
      if (!process.env.DATABASE_URL) {
        // During build time on Vercel, env vars might be missing.
        // We return an empty mock result to prevent the build from crashing.
        console.warn('⚠️ DATABASE_URL not found. Returning mock result for build.');
        return { rows: [], rowCount: 0 };
      }

      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' 
          ? { rejectUnauthorized: false }
          : false,
      });
    }
    
    return pool.query(text, params);
  }
};
