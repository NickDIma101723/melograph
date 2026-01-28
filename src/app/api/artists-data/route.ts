import { NextResponse } from 'next/server';

// Force dynamic to ensure fresh data on serverless deployments
export const dynamic = 'force-dynamic';

const ROSTER = [
  'Kendrick Lamar',
  'Manos', 
  'Sombr',
  'Frank Ocean',
  'Tame Impala',
  'Bjork',
  'Aphex Twin',
  'Tyler, The Creator',
  'FKA Twigs',
  'Daft Punk',
  'The Weeknd',
  'Lana Del Rey',
  'Kanye West',
  'Radiohead',
  'Gorillaz',
  'Rosalia',
  'Travis Scott',
  'Lorde'
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

export async function GET() {
  console.log('[ArtistsAPI] Fetching fresh data...');

  const validArtists: ArtistData[] = [];

  for (const name of ROSTER) {
    // Custom Search Terms
    let query = name;
    if (name === 'Kendrick Lamar') query = 'Kendrick Lamar Not Like Us';
    if (name === 'Manos') query = 'Manos Baby'; 
    if (name === 'Sombr') query = 'Sombr Back to Being Friends';

    try {
        // 1. Search iTunes
        let songResult = null;
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
            if (res.ok) {
                const data = await res.json();
                songResult = data.results?.[0];
            } else {
                console.error(`iTunes API error for ${name}: ${res.status}`);
            }
        } catch(e) { console.error(`Failed to fetch ${name}`, e); }

        // Manos Fallback
        if (!songResult && name === 'Manos') {
            validArtists.push({
                idArtist: 'manos-manual',
                strArtist: 'Manos',
                strGenre: 'Hit Single',
                strStyle: 'Baby',
                strArtistThumb: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1200', 
                strBiographyEN: '',
                previewUrl: undefined,
                isVideo: false
            });
            continue;
        }

        if (songResult) {
            // 2. Try to find Video URL (iTunes)
            let videoUrl = undefined;
            let isVideo = false;
            try {
                const videoQuery = `${songResult.artistName} ${songResult.trackName}`;
                const resVideo = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(videoQuery)}&entity=musicVideo&limit=1`);
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
                     const ytSearch = require('yt-search');
                     const ytQuery = `${songResult?.artistName || name} ${songResult?.trackName || ''} official music video`;
                     const r = await ytSearch(ytQuery);
                     if (r?.videos?.length > 0) {
                         youtubeId = r.videos[0].videoId;
                         isVideo = false;
                     }
                 } catch(e) { /* ignore yt */ }
            }
            
            console.log(`[ArtistsAPI] Found: ${name} -> ${songResult.trackName}`);

            validArtists.push({
                idArtist: String(songResult.collectionId || songResult.trackId),
                strArtist: name,
                strGenre: songResult.primaryGenreName || 'Music',
                strStyle: songResult.trackName,
                strArtistThumb: songResult.artworkUrl100?.replace('100x100bb', '1200x1200bb'),
                previewUrl: videoUrl || songResult.previewUrl,
                isVideo: isVideo,
                youtubeId: youtubeId,
                strBiographyEN: '',
            });
        }
    } catch (err) {
        console.error(`Error processing ${name}`, err);
    }
    
    // DELAY to be nice to iTunes API (Avoid 403 Forbidden on burst)
    await new Promise(r => setTimeout(r, 100)); 
  }

  return NextResponse.json(validArtists);
}
