import ArtistsClient from './ArtistsClient';

// Force Cache for 1 Hour (ISR)
export const revalidate = 3600;

export const metadata = {
  title: 'Artists - Melograph',
  description: 'Explore our curated list of legendary artists',
};

export default function ArtistsPage() {
  // NON-BLOCKING: Return shell immediately. 
  // Client fetches data asynchronously via /api/artists-data
  return <ArtistsClient initialArtists={[]} />;
}
