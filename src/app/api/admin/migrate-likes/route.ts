import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        await sql`ALTER TABLE likes ADD COLUMN IF NOT EXISTS preview_url TEXT`;
        return NextResponse.json({ success: true, message: 'Added preview_url column' });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
