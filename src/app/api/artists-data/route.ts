import { NextResponse } from 'next/server';
import ytSearch from 'yt-search';

// Force dynamic to ensure fresh data on serverless deployments
// Changed to revalidate to cache results and improve performance
export const revalidate = 3600; 
export const maxDuration = 60; // Allow 60s timeout if supported

const ROSTER = [
  'Kendrick Lamar',
  'Bad Bunny', 
  'Sombr',
  'Frank Ocean',
  'Juice WRLD',
  'XXXTENTACION',
  'Lil Peep',
  'Mac Miller',
  'Tame Impala',
  'Bjork',
  'Aphex Twin',
  'Tyler, The Creator',
  'Playboi Carti',
  'FKA Twigs',
  'Daft Punk',
  'The Weeknd',
  'Lana Del Rey',
  'Kanye West',
  'Radiohead',
  'Gorillaz',
  'Rosalia',
  'Travis Scott',
  'Lorde',
  'Drake',
  'J. Cole',
  'Billie Eilish',
  'SZA',
  'A$AP Rocky', 
  'Kid Cudi',
  'Post Malone'
];

interface ArtistData {
    idArtist: string;
    strArtist: string;
    strGenre: string;
    strArtistThumb: string;
    strBiographyEN: string; 
    strStyle: string;
    previewUrl?: string;
    isVideo?: boolean;
    youtubeId?: string;
}

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for fetching single artist data
async function fetchArtistData(name: string): Promise<ArtistData | null> {
    // Custom Search Terms
    let query = name;
    if (name === 'Kendrick Lamar') query = 'Kendrick Lamar Not Like Us';
    if (name === 'Sombr') query = 'Sombr Back to Being Friends';

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            // Rate limiting delay (increase with retries)
            await delay(500 * (attempt + 1) + Math.random() * 200);

            // 1. Search iTunes with Timeout
            let songResult = null;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000 + (attempt * 1000)); // Increase timeout on retry

                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    songResult = data.results?.[0];
                } else if (res.status === 429 || res.status === 403) {
                     console.warn(`iTunes API rate limit for ${name}: ${res.status}. Retrying...`);
                     attempt++;
                     await delay(2000 * attempt); // Increased backoff
                     continue;
                } else {
                    console.error(`iTunes API error for ${name}: ${res.status}`);
                    // Don't retry other 4xx errors
                    if (res.status >= 400 && res.status < 500) break;
                }
            } catch(e) { 
                console.error(`Failed to fetch ${name}`, e);
                attempt++;
                await delay(1000); // Wait before retry on network error
                continue;
            }

            if (songResult) {
                // 2. Try to find Video URL (iTunes)
                let videoUrl = undefined;
                let isVideo = false;
                try {
                    const videoQuery = `${songResult.artistName} ${songResult.trackName}`;
                    // Small random delay to jitter requests slightly
                    await new Promise(r => setTimeout(r, Math.random() * 50));
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout for video
                    
                    const resVideo = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(videoQuery)}&entity=musicVideo&limit=1`, {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (resVideo.ok) {
                        const dataVideo = await resVideo.json();
                        const videoResult = dataVideo.results?.[0];
                        if (videoResult && videoResult.artistName.toLowerCase().includes(songResult.artistName.toLowerCase())) {
                            videoUrl = videoResult.previewUrl;
                            isVideo = true;
                        }
                    }
                } catch(e) { /* ignore */ }

                let youtubeId = undefined;
                if ((!isVideo) || (name.toLowerCase().includes('sombr'))) {
                    try {
                        const ytQuery = `${songResult?.artistName || name} ${songResult?.trackName || ''} official music video`;
                        
                        // Wrap ytSearch in a promise with timeout
                        const searchPromise = ytSearch(ytQuery);
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('YT Timeout')), 3000));
                        
                        const r: any = await Promise.race([searchPromise, timeoutPromise]);

                        if (r?.videos?.length > 0) {
                            youtubeId = r.videos[0].videoId;
                            isVideo = false;
                        }
                    } catch(e) { /* ignore yt */ }
                }
                
                console.log(`[ArtistsAPI] Found: ${name} -> ${songResult.trackName}`);

                return {
                    idArtist: String(songResult.collectionId || songResult.trackId),
                    strArtist: name,
                    strGenre: songResult.primaryGenreName || 'Music',
                    strStyle: songResult.trackName,
                    strArtistThumb: songResult.artworkUrl100?.replace('100x100bb', '1200x1200bb'),
                    previewUrl: videoUrl || songResult.previewUrl,
                    isVideo: isVideo,
                    youtubeId: youtubeId,
                    strBiographyEN: '',
                };
            }
            
            // If we are here, we got no result but no rate limit error, so we break loop and return null
            break;

        } catch (err) {
            console.error(`Error processing ${name}`, err);
            break;
        }
    }
    return null;
}

// Global cache for API route
let globalCache: { data: ArtistData[]; timestamp: number } | null = null;
const CACHE_TTL = 3600 * 1000; // 1 hour

export async function GET() {
  if (globalCache && (Date.now() - globalCache.timestamp < CACHE_TTL)) {
      console.log('[ArtistsAPI] Returning cached data (API Route)');
      return NextResponse.json(globalCache.data, {
          headers: {
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
          }
      });
  }

  console.log('[ArtistsAPI] Fetching fresh data (Concurrent)...');
  
  try {
      // Netlify/Serverless Timeout Safety
      // Stop processing new requests after 8000ms to ensure we return a response before the 10s hard limit
      const TIME_LIMIT = 8000;
      const startTime = Date.now();
      
      const CONCURRENCY = 3; // Slight increase since we have a global timeout now
      const queue = [...ROSTER].map((name, index) => ({ name, index }));
      const results = new Array(ROSTER.length).fill(null);

      const worker = async () => {
          while(queue.length > 0) {
              // Check time limit
              if (Date.now() - startTime > TIME_LIMIT) {
                  console.warn('[ArtistsAPI] Time limit reached, stopping worker.');
                  break;
              }

              const item = queue.shift();
              if (!item) break;
              try {
                  const data = await fetchArtistData(item.name);
                  results[item.index] = data;
              } catch (e) {
                  console.error(`Worker error for ${item.name}`, e);
                  results[item.index] = null;
              }
          }
      };

      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

      const validArtists = results.filter(item => item !== null) as ArtistData[];
      
      if (validArtists.length > 0) {
           globalCache = { data: validArtists, timestamp: Date.now() };
      }
      
      console.log(`[ArtistsAPI] Completed with ${validArtists.length} artists in ${Date.now() - startTime}ms`);

      return NextResponse.json(validArtists, {
          headers: {
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
          }
      });
  } catch (error) {
      console.error('[ArtistsAPI] Critical Error:', error);
      // Return empty array instead of 500 to allow client fallback
      return NextResponse.json([], { status: 200 }); 
  }
}
