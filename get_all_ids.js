const yts = require('yt-search');

const queries = [
  'Frank Ocean Pink + White',
  'Tame Impala The Less I Know The Better',
  'Bjork Army of Me',
  'Aphex Twin Windowlicker',
  'Tyler The Creator Earfquake',
  'FKA Twigs Two Weeks',
  'Daft Punk One More Time',
  'The Weeknd Blinding Lights',
  'Lana Del Rey Summertime Sadness',
  'Kanye West Stronger',
  'Radiohead Creep',
  'Gorillaz Feel Good Inc',
  'Rosalia Malamente',
  'Travis Scott Sicko Mode',
  'Lorde Royals'
];

async function run() {
  console.log('Fetching IDs...');
  for (const q of queries) {
    try {
      const r = await yts(q);
      const video = r.videos[0];
      if (video) {

        console.log(`'${q}': '${video.videoId}',`); 
      }
    } catch (e) {
      console.error(`Error for ${q}:`, e.message);
    }
  }
}

run();