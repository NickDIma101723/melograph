import { neon } from '@neondatabase/serverless';

// Ensure you have DATABASE_URL in your .env or Netlify Environment Variables
// Connection string format: postgres://user:pass@endpoint.neon.tech/neondb
if (!process.env.DATABASE_URL) {
  console.warn('Warning: DATABASE_URL is not defined. Database operations will fail.');
}

// Fallback to avoid build errors if env var is missing (e.g. during CI build)
const connectionString = process.env.DATABASE_URL || 'postgres://placeholder:placeholder@placeholder.neondb/placeholder';

const sql = neon(connectionString);

export default sql;