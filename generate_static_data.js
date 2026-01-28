const fs = require('fs');

const ROSTER = [
  'Kendrick Lamar', 'Manos', 'Sombr', 'Frank Ocean', 'Juice WRLD', 'XXXTENTACION', 'Lil Peep', 'Mac Miller', 'Tame Impala', 'Bjork', 'Aphex Twin', 'Tyler, The Creator', 'Playboi Carti', 'FKA Twigs', 'Daft Punk', 'The Weeknd', 'Lana Del Rey', 'Kanye West', 'Radiohead', 'Gorillaz', 'Rosalia', 'Travis Scott', 'Lorde', 'Drake', 'J. Cole', 'Billie Eilish', 'SZA', 'A$AP Rocky', 'Kid Cudi', 'Post Malone'
];

async function fetchArtist(name) {
    if (name === 'Manos') {
        return {
            idArtist: 'manos-manual',
            strArtist: 'Manos',
            strGenre: 'Hit Single',
            strStyle: 'Baby',
            strArtistThumb: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1200',
        };
    }

    let query = name;
    if (name === 'Kendrick Lamar') query = 'Kendrick Lamar Not Like Us';
    if (name === 'Sombr') query = 'Sombr Back to Being Friends';

    try {
        console.log(`fetching ${name}...`);
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
        const data = await res.json();
        const songResult = data.results?.[0];
        
        if (songResult) {
            return {
                idArtist: String(songResult.collectionId || songResult.trackId),
                strArtist: name,
                strGenre: songResult.primaryGenreName,
                strStyle: songResult.trackName,
                strArtistThumb: songResult.artworkUrl100 ? songResult.artworkUrl100.replace('100x100bb', '600x600bb') : '',
            };
        }
    } catch(e) {
        console.error("Error fetching", name, e);
    }
    return {
         idArtist: 'error-' + name,
         strArtist: name,
         strArtistThumb: '',
         strGenre: 'Artist'
    };
}

async function main() {
    const results = [];
    for (const name of ROSTER) {
        const data = await fetchArtist(name);
        results.push(data);
        await new Promise(r => setTimeout(r, 200));
    }
    
    fs.writeFileSync('src/lib/static-artist-data.json', JSON.stringify(results, null, 2));
    console.log("Written to src/lib/static-artist-data.json");
}

main();