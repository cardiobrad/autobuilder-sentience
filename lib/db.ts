import { Pool } from 'pg';

// Holds the active connection pool
let pool: Pool | null = null;

// The db object wrapper that initializes the pool only when needed
export const db = {
  query: async (text: string, params?: any[]) => {
    // If pool doesn't exist, create it (Lazy Loading)
    if (!pool) {
      // Build-time safety check (Autobuilder's logic applied to SQL)
      if (!process.env.DATABASE_URL) {
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
