import { Pool } from 'pg';

let pool: Pool | null = null;

export const db = {
  query: async (text: string, params?: any[]) => {
    if (!pool) {
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
