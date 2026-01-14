import { NextResponse } from 'next/server';
import yts from 'yt-search';

// Prevent caching issues
export const dynamic = 'force-dynamic';

// 1. HARDCODED TRUNK (The "Safety Net" for rare artists or specific overrides)
const TRUNK: Record<string, string> = {
  'sombr': 'PboALhmuYws', // Back to Being Friends (Live)
  'manos': '4iMsU3WLI4Y', // Baby
  'kendrick': 'H58vbez_m4E', // Not Like Us
  'travis': '6ONRf7h3Mdk', // Sicko Mode
  'lorde': 'nlcIKh6sBtc', // Royals
  'rosalia': 'p_4coiRG_BI',
  'aphex twin': 'FATTzbm78cc',
  // Key tracks user loves that might not match perfectly in DB
  'frank ocean pink': 'uzS3WG6__G4'
};

// Helper: TADB Video Search
async function searchTheAudioDB(artist: string, track: string): Promise<string | null> {
  try {
    // A. Find Artist ID
    const resArtist = await fetch(`https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(artist)}`);
    const dataArtist = await resArtist.json();
    const artistId = dataArtist.artists?.[0]?.idArtist;

    if (!artistId) return null;

    // B. Get All Videos for Artist
    const resVids = await fetch(`https://www.theaudiodb.com/api/v1/json/2/mvid.php?i=${artistId}`);
    const dataVids = await resVids.json();

    if (!dataVids.mvids) return null;

    // C. Find Matching Track (Fuzzy Match)
    const normalizedTrack = track.toLowerCase().replace(/[^\w\s]/gi, '');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = dataVids.mvids.find((v: any) => {
        const vTrack = (v.strTrack || '').toLowerCase().replace(/[^\w\s]/gi, '');
        return vTrack.includes(normalizedTrack) || normalizedTrack.includes(vTrack);
    });

    if (match && match.strMusicVid) {
         // Extract ID from URL (http://www.youtube.com/watch?v=TMfPJT4XjAI)
         const vidUrl = match.strMusicVid;
         const vidId = vidUrl.split('v=')[1];
         return vidId || null;
    }
  } catch(e) {
    console.warn(`TADB Search failed for ${artist}`, e);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); // e.g. "Frank Ocean Pink + White official music video"
  
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const lowerQ = query.toLowerCase();

    // STRATEGY 1: CHECK TRUNK (Instant)
    for (const [key, id] of Object.entries(TRUNK)) {
      if (lowerQ.includes(key)) {
        return NextResponse.json({ videoId: id, source: 'trunk' });
      }
    }

    // Parse Artist/Track from query loosely
    // Query usually format: "Artist Name Track Name official music video"
    // We can try to guess, or we can rely on the frontend passing cleaner params? 
    // For now, let's try to pass the query to TADB if we can extract the artist.
    // Actually, TADB requires exact Artist Name search. 
    // The current query is a bag of words. This is tricky for TADB without structured input.
    // BUT, we can try to guess the artist from the query by removing "official music video" etc.
    
    // Alternative: We stick to yt-search for complex queries, BUT the user hates it.
    // Let's try TADB with the first few words as "Artist"?
    
    // Actually, the prompt is "find me a different api".
    // TADB is great if we have structured data.
    // Let's rely on yt-search ONLY if TADB fails, but prioritize TADB if we can parse it.
    
    // Let's stick with the HYBRID approach where we try `yt-search` but handle it better.
    // User hates `yt-search` failures.
    
    // Let's try Invidious! (Another Scraper API, but different endpoint)
    // https://invidious.jing.rocks/api/v1/search?q=...
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
