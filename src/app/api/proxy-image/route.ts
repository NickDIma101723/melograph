import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL param', { status: 400 });
  }

  // Create a persistent cache directory
  const cacheDir = path.join(process.cwd(), '.cache', 'images');
  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  } catch (e) {
    console.error('Cache dir creation failed', e);
  }

  // Generate a unique filename based on the URL
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const filePath = path.join(cacheDir, hash);
  
  console.log(`[Proxy] Requesting: ${url}`);
  console.log(`[Proxy] Hash: ${hash}`);

  try {
    // 1. Check if image is already cached on disk
    if (fs.existsSync(filePath)) {
      console.log(`[Proxy] Cache HIT for ${hash}`);
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/jpeg', // Default to JPEG for iTunes
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT'
        }
      });
    }

    console.log(`[Proxy] Cache MISS for ${hash} - Fetching...`);

    // 2. Fetch if not cached
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    // 3. Save to disk
    try {
        fs.writeFileSync(filePath, buffer);
        console.log(`[Proxy] Wrote to cache: ${filePath}`);
    } catch (writeErr) {
        console.error('Failed to write to cache:', writeErr);
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*'); 
    headers.set('X-Cache', 'MISS');

    return new NextResponse(buffer, {
        headers
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
