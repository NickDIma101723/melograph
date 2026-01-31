const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            if (key && val && !key.startsWith('#')) {
                process.env[key] = val;
            }
        }
    });
}

const sql = neon(process.env.DATABASE_URL);

async function setup() {
  console.log('Creating password_reset_tokens table...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  console.log('✅ password_reset_tokens table created successfully!');
}

setup().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
