const yts = require('yt-search');

const queries = [
  'Sombr Back to Being Friends',
  'Kendrick Lamar Not Like Us',
  'Manos Baby',
  'Frank Ocean Pink + White',
  'Tame Impala The Less I Know The Better'
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