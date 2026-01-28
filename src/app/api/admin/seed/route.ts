import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { fetchArtistData } from '@/lib/artist-data';
import { ROSTER } from '@/lib/constants';

// Increase timeout for seeding
export const maxDuration = 300; 

export async function GET() {
  try {
     const client = await sql.connect();
     
     try {
       // 1. Schema
       console.log('Creating table...');
       await client.query(`
         CREATE TABLE IF NOT EXISTS artists (
           id TEXT PRIMARY KEY,
           name TEXT UNIQUE NOT NULL,
           genre TEXT,
           style TEXT,
           image_url TEXT,
           bio TEXT,
           preview_url TEXT,
           is_video BOOLEAN,
           youtube_id TEXT,
           updated_at TIMESTAMP DEFAULT NOW()
         );
       `);

       // 2. Fetch & Insert
       const results = [];
       // Process serially to avoid strict rate limits during seed
       for (const name of ROSTER) {
           console.log(`Seeding: ${name}`);
           const data = await fetchArtistData(name);
           
           if (data) {
               await client.query(`
                  INSERT INTO artists (id, name, genre, style, image_url, bio, preview_url, is_video, youtube_id)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                  ON CONFLICT (name) DO UPDATE SET
                    genre = EXCLUDED.genre,
                    style = EXCLUDED.style,
                    image_url = EXCLUDED.image_url,
                    preview_url = EXCLUDED.preview_url,
                    is_video = EXCLUDED.is_video,
                    youtube_id = EXCLUDED.youtube_id,
                    updated_at = NOW();
               `, [
                   data.idArtist,
                   data.strArtist,
                   data.strGenre,
                   data.strStyle,
                   data.strArtistThumb,
                   data.strBiographyEN,
                   data.previewUrl,
                   data.isVideo,
                   data.youtubeId
               ]);
               results.push(name);
           }
       }
       
       return NextResponse.json({ success: true, seeded: results });

     } finally {
       client.release();
     }
  } catch (e: any) {
     return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
