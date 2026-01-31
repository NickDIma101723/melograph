import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import sql from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { token, email, newPassword } = await request.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const resetTokens = await sql`
      SELECT * FROM password_reset_tokens
      WHERE token_hash = ${tokenHash} AND used = FALSE AND expires_at > NOW()
    `;

    if (resetTokens.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const resetToken = resetTokens[0];

    // Get user
    const users = await sql`SELECT id FROM users WHERE email = ${email} AND id = ${resetToken.user_id}`;
    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await sql`UPDATE users SET password_hash = ${hashedPassword} WHERE id = ${resetToken.user_id}`;

    // Mark token as used
    await sql`UPDATE password_reset_tokens SET used = TRUE WHERE id = ${resetToken.id}`;

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}