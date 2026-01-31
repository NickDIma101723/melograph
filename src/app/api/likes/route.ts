import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session?.user) return NextResponse.json([], { status: 401 });

    try {
        const likes = await sql`
            SELECT * FROM likes WHERE user_id = ${session.user.id} ORDER BY created_at DESC
        `;
        return NextResponse.json(likes);
    } catch(e) {
        return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { artist_name, song_title, cover_url } = await request.json();

        // Check if already liked
        const existing = await sql`
            SELECT id FROM likes 
            WHERE user_id = ${session.user.id} 
            AND artist_name = ${artist_name} 
            AND song_title = ${song_title}
        `;

        if (existing.length > 0) {
            // Unlike
            await sql`
                DELETE FROM likes 
                WHERE id = ${existing[0].id}
            `;
            return NextResponse.json({ liked: false });
        } else {
            // Like
            await sql`
                INSERT INTO likes (user_id, artist_name, song_title, cover_url)
                VALUES (${session.user.id}, ${artist_name}, ${song_title}, ${cover_url})
            `;
            return NextResponse.json({ liked: true });
        }

    } catch(e) {
        console.error(e);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
