import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import Parser from 'rss-parser';

// Types
interface DashboardData {
    topTracks: any[];
    news: any[];
    stats: {
        activeUsers: number;
        streamsToday: number;
    };
    lastUpdated: string;
}

export const revalidate = 0; // Disable Next.js cache, we control it manually with Postgres

export async function GET() {
    try {
        // 0. Ensure Table Exists (For demo purposes - usually done in migration)
        await sql`
            CREATE TABLE IF NOT EXISTS api_cache (
                key TEXT PRIMARY KEY,
                data JSONB NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 1. Check Cache (Neon Postgres)
        // We cache for 1 hour (3600 seconds)
        const rows = await sql`
            SELECT data FROM api_cache 
            WHERE key = ${'dashboard_main'} 
            AND updated_at > NOW() - INTERVAL '1 hour'
        `;

        if (rows.length > 0) {
            console.log('[Dashboard] Serving from Neon Cache');
            return NextResponse.json(rows[0].data);
        }

        console.log('[Dashboard] Cache Stale/Missing. Fetching External APIs...');

        // 2. Parallel Fetching (External APIs)
        const parser = new Parser();
        const [itunesRes, newsFeed, deezerRes] = await Promise.all([
            // API 1: iTunes Top Charts (Music)
            fetch('https://itunes.apple.com/us/rss/topsongs/limit=5/json').then(r => r.json()),
            
            // API 2: Music News RSS (External)
            parser.parseURL('https://www.nme.com/feed'),
            
            // API 3: Deezer Chart (Alternative Source)
            fetch('https://api.deezer.com/chart/0/tracks?limit=5').then(r => r.json())
        ]);

        // 3. Process & Aggregate Data
        const dashboardData: DashboardData = {
            topTracks: itunesRes.feed.entry.map((e: any) => ({
                title: e['im:name'].label,
                artist: e['im:artist'].label,
                image: e['im:image'][2].label
            })),
            news: newsFeed.items.slice(0, 3).map((item: any) => ({
                title: item.title,
                link: item.link,
                date: item.pubDate
            })),
            stats: {
                activeUsers: Math.floor(Math.random() * 5000), // Mock real-time stat
                streamsToday: deezerRes.total || 150000
            },
            lastUpdated: new Date().toISOString()
        };

        // 4. Update Cache (Neon Postgres)
        // UPSERT strategy: Insert or Update if exists
        const jsonData = JSON.stringify(dashboardData);
        await sql`
            INSERT INTO api_cache (key, data, updated_at)
            VALUES (${'dashboard_main'}, ${jsonData}, NOW())
            ON CONFLICT (key) 
            DO UPDATE SET data = ${jsonData}, updated_at = NOW()
        `;

        return NextResponse.json(dashboardData);

    } catch (error) {
        console.error('[Dashboard Error]', error);
        
        // Convert to string safely
        const errorMessage = error instanceof Error 
            ? error.message 
            : typeof error === 'string' 
                ? error 
                : 'Unknown database error - Ensure DATABASE_URL is set in .env';

        return NextResponse.json(
            { error: 'Internal Server Error', details: errorMessage }, 
            { status: 500 }
        );
    }
}