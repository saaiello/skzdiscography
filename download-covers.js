const albums = [
  {"name": "5-STAR", "slug": "5-star"},
  {"name": "ATE", "slug": "ate"},
  {"name": "All IN", "slug": "all-in"},
  {"name": "Christmas EveL", "slug": "christmas-evel"},
  {"name": "Cle 1: MIROH", "slug": "cle-1-miroh"},
  {"name": "Cle 2: YELLOW WOOD", "slug": "cle-2-yellow-wood"},
  {"name": "Cle: LEVANTER", "slug": "cle-levanter"},
  {"name": "Do It", "slug": "do-it"},
  {"name": "GIANT", "slug": "giant"},
  {"name": "GO LIVE", "slug": "go-live"},
  {"name": "HOP", "slug": "hop"},
  {"name": "Hollow", "slug": "hollow"},
  {"name": "I am NOT", "slug": "i-am-not"},
  {"name": "I am WHO", "slug": "i-am-who"},
  {"name": "I am YOU", "slug": "i-am-you"},
  {"name": "IN LIFE", "slug": "in-life"},
  {"name": "KARMA", "slug": "karma"},
  {"name": "MAXIDENT", "slug": "maxident"},
  {"name": "Mixtape", "slug": "mixtape"},
  {"name": "Mixtape dominATE", "slug": "mixtape-dominate"},
  {"name": "NOEASY", "slug": "noeasy"},
  {"name": "ODDINARY", "slug": "oddinary"},
  {"name": "ROCKSTAR", "slug": "rockstar"},
  {"name": "SKZ 2021", "slug": "skz-2021"},
  {"name": "SKZ Replay 2026 pt 1", "slug": "skz-replay-2026-pt-1"},
  {"name": "SKZ-REPLAY", "slug": "skz-replay"},
  {"name": "THE SOUND", "slug": "the-sound"},
  {"name": "This & That", "slug": "this-that"}
];

import fs from 'fs';

async function lookupAlbum(album) {
  const query = encodeURIComponent(`${album.name} Stray Kids`);
  const url = `https://itunes.apple.com/search?term=${query}&entity=album&limit=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.results.length === 0) {
      return { ...album, found: false };
    }

    const result = data.results[0];
    // artworkUrl100 is a low-res thumbnail URL — swap the size in the path for a bigger version
    const artworkUrl = result.artworkUrl100.replace('100x100', '600x600');

    return {
      ...album,
      found: true,
      matchedCollectionName: result.collectionName,
      artworkUrl,
    };
  } catch (err) {
    return { ...album, found: false, error: err.message };
  }
}

async function downloadImage(url, filepath) {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
}

async function run() {
  if (!fs.existsSync('assets/covers')) {
    fs.mkdirSync('assets/covers', { recursive: true });
  }

  const results = [];

  for (const album of albums) {
    const result = await lookupAlbum(album);

    if (result.found) {
      try {
        await downloadImage(result.artworkUrl, `assets/covers/${album.slug}.jpg`);
        console.log(`✓  ${album.name} → saved as ${album.slug}.jpg (matched: ${result.matchedCollectionName})`);
      } catch (err) {
        console.log(`✗  ${album.name} → found artwork but failed to download: ${err.message}`);
      }
    } else {
      console.log(`✗  ${album.name} → no artwork found`);
    }

    results.push(result);
    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync('cover-results.json', JSON.stringify(results, null, 2));
  const failed = results.filter(r => !r.found).length;
  console.log(`\nDone. ${results.length - failed} / ${results.length} covers downloaded.`);
}

run();
