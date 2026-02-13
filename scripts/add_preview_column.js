
const { neon } = require('@neondatabase/serverless');

// Run with: node scripts/add_preview_column.js
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
}

const sql = neon(connectionString);

async function run() {
    try {
        console.log('Adding preview_url column to likes table...');
        await sql`ALTER TABLE likes ADD COLUMN IF NOT EXISTS preview_url TEXT`;
        console.log('Success!');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

run();
