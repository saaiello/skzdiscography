import fs from 'fs';

const API_KEY = 'AIzaSyDdKLDR91TzaHAhR8TJ4MEo9B-Qe3pBdIc';

// Adjust this if you ever scale to other groups — these are treated as "official"
const OFFICIAL_CHANNELS = ['stray kids', 'jyp entertainment'];

async function searchVideo(title) {
  const query = encodeURIComponent(`${title} Stray Kids official MV`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return { title, found: false, error: data.error.message };
    }
    if (!data.items || data.items.length === 0) {
      return { title, found: false };
    }

    const video = data.items[0];
    const channel = video.snippet.channelTitle;
    const isOfficial = OFFICIAL_CHANNELS.some(c => channel.toLowerCase().includes(c));

    return {
      title,
      found: true,
      matchedTitle: video.snippet.title,
      channel,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      needsReview: !isOfficial,
    };
  } catch (err) {
    return { title, found: false, error: err.message };
  }
}

async function run() {
  const songsRaw = fs.readFileSync('data/songs.json', 'utf8');
  const songs = JSON.parse(songsRaw);

  // only look up songs that don't already have a YouTube link
  const remaining = songs.filter(s => !s.links.youtube);
  console.log(`${remaining.length} songs still need a YouTube link.\n`);

  // load prior progress if this is a second run
  let results = [];
  if (fs.existsSync('youtube-results.json')) {
    results = JSON.parse(fs.readFileSync('youtube-results.json', 'utf8'));
  }
  const alreadyDone = new Set(results.filter(r => r.found).map(r => r.title));

  const DAILY_LIMIT = 95; // leaves a small buffer under YouTube's ~100/day free quota
  let searchesUsedToday = 0;

  for (const song of remaining) {
    if (alreadyDone.has(song.title)) continue; // skip if already looked up in a prior run
    if (searchesUsedToday >= DAILY_LIMIT) {
      console.log(`\nHit today's limit of ${DAILY_LIMIT} searches. Run again tomorrow to continue.`);
      break;
    }

    const result = await searchVideo(song.title);
    results.push(result);
    searchesUsedToday++;

    const status = result.error ? '✗ ERROR' : result.needsReview ? '⚠️ ' : result.found ? '✓ ' : '✗ NOT FOUND';
    console.log(`${status} ${song.title}${result.matchedTitle ? ' → ' + result.matchedTitle + ' (' + result.channel + ')' : ''}`);

    fs.writeFileSync('youtube-results.json', JSON.stringify(results, null, 2));

    await new Promise(r => setTimeout(r, 500));
  }

  const total = results.length;
  const needsReview = results.filter(r => r.needsReview).length;
  const notFound = results.filter(r => !r.found).length;
  console.log(`\n${total} looked up so far. ${needsReview} need review, ${notFound} not found.`);
}

run();
