import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, username, isArtist } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
    }

    const existingUser = await sql`SELECT id FROM users WHERE email = ${email} OR username = ${username}`;
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (email, username, password_hash, is_artist)
      VALUES (${email}, ${username}, ${hashedPassword}, ${isArtist || false})
      RETURNING id, email, username, is_artist
    `;
    const user = result[0];

    await createSession(user);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}