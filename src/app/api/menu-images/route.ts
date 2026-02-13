import { NextResponse } from 'next/server';

const getItunesImage = async (term: string) => {
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=1`);
    const data = await response.json();
    const result = data.results?.[0];
    
    if (result && result.artworkUrl100) {
      // Upscale the image from 100x100 to 1200x1200 for high quality
      return result.artworkUrl100.replace('100x100bb', '1200x1200bb');
    }
    return null;
  } catch (e) {
    console.error('Error fetching from iTunes:', e);
    return null;
  }
};

export const dynamic = 'force-dynamic';

export async function GET() {
  // Default images as fallback
  let billieImage = 'https://images.unsplash.com/photo-1615241721535-3d84b29bb88a?q=80&w=1200';
  let travisImage = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200';
  let tylerImage = 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1200';

  // New Login & Top 20 Images
  let daftImage = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200';
  let weekndImage = 'https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=1200'; // Fallback
  let kraftwerkImage = 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200'; // Fallback for Dashboard
  let frankImage = 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=1200'; // Fallback for Profile

  // Fetch real artwork asynchronously
  const [billie, travis, tyler, daft, weeknd, kraftwerk, frank] = await Promise.all([
    getItunesImage('Billie Eilish Happier Than Ever'),
    getItunesImage('Travis Scott Astroworld'),
    getItunesImage('Tyler, The Creator IGOR'),
    getItunesImage('Daft Punk Random Access Memories'),
    getItunesImage('The Weeknd After Hours'),
    getItunesImage('Kraftwerk Computer World'),
    getItunesImage('Frank Ocean Blonde')
  ]);

  if (billie) billieImage = billie;
  if (travis) travisImage = travis;
  if (tyler) tylerImage = tyler;
  if (daft) daftImage = daft;
  if (weeknd) weekndImage = weeknd;
  if (kraftwerk) kraftwerkImage = kraftwerk;
  if (frank) frankImage = frank;

  const menuItems = [
    {
      id: 'I',
      label: 'HOME',
      href: '/',
      image: travisImage
    },
    {
      id: 'II',
      label: 'ARTISTS',
      href: '/artists',
      image: billieImage
    },
    {
      id: 'III',
      label: 'TOP 100',
      href: '/top20',
      image: weekndImage
    },
    {
      id: 'IV',
      label: 'NEWS',
      href: '/news',
      image: tylerImage
    },
    {
      id: 'V',
      label: 'LOGIN',
      href: '/auth',
      image: daftImage
    },
    {
      id: 'VI',
      label: 'PROFILE',
      href: '/profile',
      image: frankImage
    },
  ];

  return NextResponse.json(menuItems);
}



