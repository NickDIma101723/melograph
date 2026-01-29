import { NextResponse } from 'next/server';
import yts from 'yt-search';

// Prevent caching issues
export const dynamic = 'force-dynamic';

// Helper function to try multiple Invidious instances
async function tryInvidiousInstances(query: string) {
  const instances = [
    'https://invidious.jing.rocks',
    'https://inv.nadeko.net',
    'https://invidious.protokolla.fi',
    'https://invidious.privacyredirect.com'
  ];

  for (const instance of instances) {
    try {
      const invidiousUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const resInv = await fetch(invidiousUrl, { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      
      if (resInv.ok) {
        const dataInv = await resInv.json();
        if (dataInv && Array.isArray(dataInv) && dataInv.length > 0) {
          console.log(`[YouTube API] Found via ${instance}`);
          return { videoId: dataInv[0].videoId, source: 'invidious' };
        }
      }
    } catch(e) {
      console.warn(`Invidious instance ${instance} failed:`, e instanceof Error ? e.message : 'unknown');
      continue;
    }
  }
  
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
  
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    console.log('[YouTube API] Query:', query);
    
    // STRATEGY 1: Try Invidious instances with timeout
    try {
      const invidiousResult = await tryInvidiousInstances(query);
      if (invidiousResult) {
        return NextResponse.json(invidiousResult);
      }
    } catch(e) {
      console.warn('[YouTube API] All Invidious instances failed:', e);
    }

    // STRATEGY 2: YT-SEARCH fallback with timeout
    try {
      console.log('[YouTube API] Trying yt-search fallback...');
      const searchPromise = yts(query);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('YT Search timeout')), 5000)
      );
      
      const r: any = await Promise.race([searchPromise, timeoutPromise]);
      
      if (r && r.videos && r.videos.length > 0) {
        console.log('[YouTube API] Found via yt-search');
        return NextResponse.json({ 
          videoId: r.videos[0].videoId, 
          source: 'yt-search' 
        });
      }
    } catch(e) {
      console.error('[YouTube API] YT-Search failed:', e instanceof Error ? e.message : 'unknown');
    }
    
    // No results found
    console.warn('[YouTube API] No videos found for:', query);
    return NextResponse.json({ 
      error: 'No videos found',
      query 
    }, { status: 404 });

  } catch (error) {
    console.error('[YouTube API] Critical Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
