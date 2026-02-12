import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession, createSession } from '@/lib/auth'; // Need to update session cookie on change

export async function POST(request: Request) {
    const session = await getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { avatar_url, username, email } = await request.json();
        
        // Build dynamic query fields
        // Note safely: sql`` helper handles simple parameterization, but for dynamic columns we need care.
        // Or just update all passed fields.
        
        const result = await sql`
            UPDATE users 
            SET 
                avatar_url = COALESCE(${avatar_url}, avatar_url),
                username = COALESCE(${username}, username),
                email = COALESCE(${email}, email)
            WHERE id = ${session.user.id}
            RETURNING *
        `;
        
        const updatedUser = result[0];
        
        // IMPORTANT: Must update the session cookie so the frontend sees new avatar immediately
        // Sanitize
        const sessionUser = {
            id: updatedUser.id,
            email: updatedUser.email,
            username: updatedUser.username,
            is_artist: updatedUser.is_artist,
            avatar_url: updatedUser.avatar_url
        };
        
        await createSession(sessionUser);

        return NextResponse.json({ user: sessionUser });

    } catch(e) {
        console.error('PROFILE UPDATE ERROR:', e);
        return NextResponse.json({ error: 'Update failed', details: String(e) }, { status: 500 });
    }
}
