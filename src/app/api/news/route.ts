import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export async function GET() {
  const API_KEY = process.env.NEWS_API_KEY;

  if (!API_KEY) {
    try {
      console.log("No API Key found, fetching from NME Music RSS...");
      const parser = new Parser();
      
      // Fetch from NME RSS feed for real-time music news (2025/2026 dates)
      // We use the specific /news/music/feed to ensure all content is music-related
      const feed = await parser.parseURL('https://www.nme.com/news/music/feed');
      
      const articles = feed.items.map((item: any) => {
         let imageUrl = null;
         
         // Extract image from content content:encoded
         // NME puts the main image in the content
         const content = item['content:encoded'] || item.content || "";
         const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
         if (imgMatch) {
           imageUrl = imgMatch[1];
         }

         // Use RSS fields
         return {
            source: { id: 'nme', name: 'NME' },
            author: item.creator || 'NME Staff',
            title: item.title,
            description: item.contentSnippet || "",
            url: item.link,
            urlToImage: imageUrl,
            publishedAt: item.isoDate || item.pubDate, // Use real date
            categories: item.categories || [], // Pass categories
            content: content
         };
      }).filter((article: any) => article.urlToImage); // Filter out articles without images for quality UI

      if (articles.length > 0) {
        return NextResponse.json({
            status: "ok",
            source: "rss-live",
            articles: articles
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
    const res = await fetch(`https://newsapi.org/v2/everything?q=music&from=2025-01-01&to=2025-12-31&sortBy=publishedAt&language=en&apiKey=${API_KEY}`, { next: { revalidate: 3600 } });
    
    if (!res.ok) {
        console.warn("2025 News fetch failed, trying latest news...");
        const fallbackRes = await fetch(`https://newsapi.org/v2/everything?q=music&sortBy=publishedAt&language=en&apiKey=${API_KEY}`, { next: { revalidate: 3600 } });
        
        if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
             return NextResponse.json(fallbackData);
        }

       throw new Error('Failed to fetch data');
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Route Handler Error:", error);
    return NextResponse.json({ error: 'Failed to fetch news', details: error.message }, { status: 500 });
  }
}
