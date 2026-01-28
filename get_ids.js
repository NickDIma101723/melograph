const yts = require('yt-search');

const queries = [
  'Kendrick Lamar SZA luthe official content',
  'Lil Uzi Vert What You Saying official video',
  'Sombr Back to Being Friends'
];

async function run() {
  for (const q of queries) {
    try {
      const r = await yts(q);
      const video = r.videos[0];
      if (video) {
        console.log(`"${q}": "${video.videoId}", // ${video.title}`);
      } else {
        console.log(`"${q}": null`);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

run();