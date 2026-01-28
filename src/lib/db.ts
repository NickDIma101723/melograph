import { Pool } from '@neondatabase/serverless';

// Ensure you have DATABASE_URL in your .env or Netlify Environment Variables
// Connection string format: postgres://user:pass@endpoint.neon.tech/neondb
const sql = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default sql;