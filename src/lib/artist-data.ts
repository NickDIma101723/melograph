import ytSearch from 'yt-search';
import { ROSTER } from '@/lib/constants';

export interface ArtistData {
    idArtist: string;
    strArtist: string;
    strGenre: string;
    strArtistThumb: string;
    strBiographyEN: string; 
    strStyle: string;
    previewUrl?: string;
    isVideo?: boolean;
    youtubeId?: string;
    intFormedYear?: string;
}

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for fetching single artist data
export async function fetchArtistData(name: string): Promise<ArtistData | null> {
    // Custom Search Terms
    let query = name;
    if (name === 'Kendrick Lamar') query = 'Kendrick Lamar Not Like Us';
    if (name === 'Manos') query = 'Manos Baby'; 
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

            // Manos Fallback
            if (!songResult && name === 'Manos') {
                return {
                    idArtist: 'manos-manual',
                    strArtist: 'Manos',
                    strGenre: 'Hit Single',
                    strStyle: 'Baby',
                    strArtistThumb: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1200', 
                    strBiographyEN: '',
                    previewUrl: undefined,
                    isVideo: false
                };
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
                if ((!isVideo) || (name.toLowerCase().includes('sombr') || name.toLowerCase().includes('manos'))) {
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

// Global Server Cache to prevent re-fetching on navigation (Persists HMR)
const CACHE_KEY = Symbol.for('melograph.artistDataCache');
type GlobalCache = { [CACHE_KEY]?: { data: ArtistData[] | null; timestamp: number } };
const globalParams = globalThis as unknown as GlobalCache;

if (!globalParams[CACHE_KEY]) {
  globalParams[CACHE_KEY] = { data: null, timestamp: 0 };
}

export async function getAllArtistsData(): Promise<ArtistData[]> {
  // 1. Check Cache (1 Hour TTL)
  const cache = globalParams[CACHE_KEY];
  const now = Date.now();
  if (cache?.data && (now - cache.timestamp < 3600 * 1000)) {
     console.log('[ArtistsAPI] Serving from Server Memory Cache ⚡');
     return cache.data;
  }

  console.log('[ArtistsAPI] Fetching fresh data (Concurrent)...');
  
  try {
      // Concurrency Limit - Increased to 4 for better speed while respecting rate limits
      const CONCURRENCY = 4;
      const queue = [...ROSTER].map((name, index) => ({ name, index }));
      const results = new Array(ROSTER.length);

      const worker = async () => {
          while(queue.length > 0) {
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
      
      // 2. Set Cache
      if (validArtists.length > 0) {
          globalParams[CACHE_KEY] = { data: validArtists, timestamp: now };
      }

      return validArtists;
  } catch (error) {
      console.error('[ArtistsAPI] Critical Error:', error);
      return [];
  }
}
