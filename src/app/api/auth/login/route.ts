import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Check for database configuration issues
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
       console.error("Critical: DATABASE_URL is missing or is the placeholder.");
       return NextResponse.json({ 
         error: 'Environment Configuration Error: DATABASE_URL is missing on Netlify. Please add it in Site Settings > Environment Variables.' 
       }, { status: 500 });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
    }

    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = users[0];

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await createSession(user);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    // Return actual error message for debugging purposes
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}