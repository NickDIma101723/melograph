const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        // Strip quotes
        acc[key.trim()] = value.trim().replace(/^['"]|['"]$/g, '');
    }
    return acc;
}, {});

const databaseUrl = envVars.DATABASE_URL;
if (!databaseUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

console.log('Testing connection to:', databaseUrl.replace(/:[^:]+@/, ':***@')); 

const sql = neon(databaseUrl);

async function test() {
    try {
        console.log('Checking connection...');
        const result = await sql`SELECT 1 as val`;
        console.log('Connection successful:', result);

        console.log('Checking users table...');
        try {
            const tableCheck = await sql`SELECT count(*) FROM users`;
            console.log('Users table exists. Count:', tableCheck);
        } catch (e) {
            console.log('Users table check failed:', e.message);
            console.log('Creating tables...');
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
            console.log('Users table created.');
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
            console.log('Likes table created.');
        }
    } catch (e) {
        console.error('Database connection failed:', e);
    }
}

test();
