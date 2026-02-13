import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('iTunes lookup error:', error);
    return NextResponse.json({ error: 'Failed to fetch from iTunes' }, { status: 500 });
  }
}
