import { neon } from '@neondatabase/serverless';

// Ensure you have DATABASE_URL in your .env or Netlify Environment Variables
// Connection string format: postgres://user:pass@endpoint.neon.tech/neondb
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);

export default sql;