import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export async function GET() {
  const API_KEY = process.env.NEWS_API_KEY;

  if (!API_KEY) {
    try {
      console.log("No API Key found, fetching from Pitchfork Music RSS...");
      const parser = new Parser({
          customFields: {
            item: [
                ['media:thumbnail', 'thumbnail'], 
                ['dc:creator', 'creator']
            ],
          }
      });
      
      // Fetch from Pitchfork RSS feed (NME was blocking requests with 403 Forbidden)
      const feed = await parser.parseURL('https://pitchfork.com/feed/feed-news/rss');
      
      const articles = feed.items.map((item: any) => {
         // Extract image from media:thumbnail
         let imageUrl = item.thumbnail?.$?.url || null; // Parser usually puts attributes in $

         return {
            source: { id: 'pitchfork', name: 'Pitchfork' },
            author: item.creator || 'Pitchfork Staff',
            title: item.title,
            description: item.contentSnippet || item.content || "",
            url: item.link,
            urlToImage: imageUrl,
            publishedAt: item.isoDate || item.pubDate, 
            categories: item.categories || [],
            content: item.content
         };
      }).filter((article: any) => article.urlToImage); // Filter out articles without images for quality UI

      if (articles.length > 0) {
        return NextResponse.json({
            status: "ok",
            source: "rss-live",
            articles: articles
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
          },
        });
      }

    } catch (e) {
      console.error("RSS fetch failed", e);
    }
    
    // Fallback if RSS fails
    return NextResponse.json({
        status: "error",
        source: "rss-failed",
        articles: []
    });
  }

  // Original Logic for when API Key is present
  try {
    // Single robust request strategy (No fallbacks to avoid overloading)
    const res = await fetch(`https://newsapi.org/v2/everything?q=music&from=2025-01-01&sortBy=publishedAt&language=en&apiKey=${API_KEY}`, { next: { revalidate: 3600 } });
    
    if (!res.ok) {
       throw new Error(`API returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Route Handler Error:", error);
    return NextResponse.json({ error: 'Failed to fetch news', details: error.message }, { status: 500 });
  }
}
