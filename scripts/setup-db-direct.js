
const { neon } = require('@neondatabase/serverless');

// Load env specific to this script context if needed, but we rely on process.env from usage
// If running via `node scripts/setup-direct.js`, we need to make sure .env.local is loaded.
// But straightforward way is to pass connection string.

const DATABASE_URL=process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gkMuqRE68twf@ep-gentle-fog-a9wffwyj-pooler.gwc.azure.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

async function main() {
  console.log('Initializing Database...');
  
  try {
     // 1. Users
     await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        username TEXT,
        avatar_url TEXT,
        is_artist BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✓ Users table checked/created');

    // 2. Likes
    await sql`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        artist_name TEXT NOT NULL,
        song_title TEXT NOT NULL,
        cover_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, artist_name, song_title)
      );
    `;
    console.log('✓ Likes table checked/created');
    
    // Updates for new profile fields? already in Users (username, email, avatar).

    console.log('Database setup complete.');
  } catch (err) {
      console.error('Setup failed:', err);
      process.exit(1);
  }
}

main();
