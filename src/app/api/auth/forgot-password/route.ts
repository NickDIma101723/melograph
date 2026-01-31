import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { randomBytes, createHash } from 'crypto';
import sql from '@/lib/db';

if (!process.env.RESEND_API_KEY) {
  console.warn('Warning: RESEND_API_KEY is not defined. Email operations will fail.');
}
const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(email);
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(email, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (isRateLimited(email)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const users = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return NextResponse.json({ success: true, message: 'Check your email for the reset link.' });
    }

    const user = users[0];
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await sql`UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ${user.id} AND used = FALSE`;
    await sql`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (${user.id}, ${tokenHash}, ${expiresAt.toISOString()})`;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    if (!process.env.RESEND_API_KEY) {
      console.log('Reset URL:', resetUrl);
      return NextResponse.json({ success: true, message: 'Check your email', devUrl: resetUrl });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset Your Melograph Password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1a1a1a; margin-bottom: 24px;">Password Reset Request</h2>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #000; color: #fff; padding: 14px 32px; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500;">Reset Password</a>
          </div>
          <p style="color: #888; font-size: 14px; line-height: 1.5;">This link will expire in 30 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="color: #888; font-size: 12px;">Melograph</p>
        </div>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
    }

    console.log('Email sent to:', email);
    return NextResponse.json({ success: true, message: 'Check your email for the reset link.' });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to send reset email. Please try again later.' }, { status: 500 });
  }
}
