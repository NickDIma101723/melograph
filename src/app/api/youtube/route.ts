import { NextResponse } from 'next/server';
import yts from 'yt-search';

// Prevent caching issues
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); // e.g. "Frank Ocean Pink + White official music video"
  
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const lowerQ = query.toLowerCase();

    // Parse Artist/Track from query loosely
    // Query usually format: "Artist Name Track Name official music video"
    
    // STRATEGY 2: Invidious (Public Instances)
    try {
       const invidiousUrl = `https://invidious.jing.rocks/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
       const resInv = await fetch(invidiousUrl);
       if (resInv.ok) {
          const dataInv = await resInv.json();
          if (dataInv && dataInv.length > 0) {
              return NextResponse.json({ videoId: dataInv[0].videoId, source: 'invidious' });
          }
       }
    } catch(e) {
       console.warn('Invidious failed', e);
    }

    // STRATEGY 3: YT-SEARCH (Last Resort, kept for safety but wrapped in error handling)
    try {
      const r = await yts(query);
      if (r.videos.length > 0) {
        return NextResponse.json({ videoId: r.videos[0].videoId, source: 'yt-search' });
      }
    } catch(e) { /* ignore */ }
    
    return NextResponse.json({ error: 'No videos found' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
