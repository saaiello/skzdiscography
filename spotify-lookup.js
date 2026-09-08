import fs from 'fs';

// Fill these in from your Spotify Developer Dashboard
const CLIENT_ID = 'ef6640488e3147c9a3230b7fcbd76624';
const CLIENT_SECRET = '8ba4a02529a14a6495738d0a7d4f3975';

async function getAccessToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Failed to get access token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

async function searchTrack(title, token) {
  const query = encodeURIComponent(`${title} Stray Kids`);
  const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();

    if (!data.tracks || data.tracks.items.length === 0) {
      return { title, found: false };
    }

    const track = data.tracks.items[0];
    return {
      title,
      found: true,
      matchedTrackName: track.name,
      matchedAlbum: track.album.name,
      spotifyUrl: track.external_urls.spotify,
      needsReview: track.name.toLowerCase() !== title.toLowerCase(),
    };
  } catch (err) {
    return { title, found: false, error: err.message };
  }
}

async function run() {
  const songsRaw = fs.readFileSync('data/songs.json', 'utf8');
  const songs = JSON.parse(songsRaw);
  const titles = songs.map(s => s.title);

  console.log(`Authenticating with Spotify...`);
  const token = await getAccessToken();
  console.log(`Authenticated. Looking up ${titles.length} songs...\n`);

  const results = [];

  for (const title of titles) {
    const result = await searchTrack(title, token);
    results.push(result);

    const status = result.error ? '✗ ERROR' : result.needsReview ? '⚠️ ' : result.found ? '✓ ' : '✗ NOT FOUND';
    console.log(`${status} ${title}${result.matchedTrackName ? ' → ' + result.matchedTrackName : ''}`);

    fs.writeFileSync('spotify-results.json', JSON.stringify(results, null, 2));

    // 500ms between requests — Spotify's rate limits are generous but not unlimited
    await new Promise(r => setTimeout(r, 500));
  }

  const notFound = results.filter(r => !r.found).length;
  const needsReview = results.filter(r => r.needsReview).length;
  console.log(`\nDone. ${notFound} not found, ${needsReview} matched but need review.`);
  console.log('Saved to spotify-results.json');
}

run();
