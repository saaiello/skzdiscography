const listenPlatforms = [
  { key: 'spotify', label: 'Spotify' },
  { key: 'appleMusic', label: 'Apple Music' },
];
const watchPlatforms = [
  { key: 'youtube', label: 'Music Video' },
];

function buildLinksContent(links, isMini = false) {
  const listenButtons = listenPlatforms
    .filter(p => links[p.key])
    .map(p => `<a class="listen-link${isMini ? ' mini' : ''}" href="${links[p.key]}" target="_blank" rel="noopener noreferrer">${p.label}</a>`)
    .join('');

  const watchButtons = watchPlatforms
    .filter(p => links[p.key])
    .map(p => `<a class="listen-link${isMini ? ' mini' : ''}" href="${links[p.key]}" target="_blank" rel="noopener noreferrer">${p.label}</a>`)
    .join('');

  if (!listenButtons && !watchButtons) return '';

  return `
    ${listenButtons ? `<div class="link-group"><span class="listen-label">Listen here:</span>${listenButtons}</div>` : ''}
    ${watchButtons ? `<div class="link-group"><span class="listen-label">Watch here:</span>${watchButtons}</div>` : ''}
  `;
}

function renderTracks(list) {
  currentList = list;
  const container = document.getElementById('tracklist');
  container.innerHTML = '';

  list.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'track';

    el.innerHTML = `
      <div class="track-row" data-i="${i}">
        <div class="col-index">${i + 1}</div>
        <img class="art" src="${t.art}" alt="${t.album} cover" onerror="this.style.visibility='hidden'">
        <div class="track-info">
          <div class="title">${t.title}</div>
          <div class="meta">${t.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}</div>
        </div>
        <div class="col-album">${t.album}</div>
        <div class="col-year">${t.year ?? '—'}</div>
        <div class="col-duration">${t.duration}</div>
        <div class="col-bpm">${t.bpm ?? '—'}</div>
        <div class="chevron">&#9656;</div>
      </div>
    `;
    container.appendChild(el);
  });
}

let allTracks = [];
let currentList = [];

function genreSimilarity(a, b) {
  const shared = a.genres.filter(g => b.genres.includes(g)).length;
  const maxPossible = Math.max(a.genres.length, b.genres.length);
  return shared / maxPossible;
}

function bpmSimilarity(a, b) {
  if (a.bpm == null || b.bpm == null) return 0.5;
  const diff = Math.abs(a.bpm - b.bpm);
  const maxDiff = 100;
  return Math.max(0, 1 - diff / maxDiff);
}

function similarityScore(a, b) {
  const genreWeight = 0.6;
  const bpmWeight = 0.4;
  return genreSimilarity(a, b) * genreWeight + bpmSimilarity(a, b) * bpmWeight;
}

function computeRecommendations(tracks) {
  tracks.forEach(song => {
    const scored = tracks
      .filter(other => other !== song)
      .map(other => ({
        title: other.title,
        album: other.album,
        year: other.year,
        duration: other.duration,
        bpm: other.bpm,
        genres: other.genres,
        art: other.art,
        links: other.links,
        score: Math.round(similarityScore(song, other) * 100) / 100,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    song.recs = scored;
  });
}

function findTrackByTitle(title) {
  return allTracks.find(t => t.title === title);
}

function openModal(track) {
  const card = document.getElementById('modal-card');

  card.innerHTML = `
    <button class="modal-close" aria-label="Close">&times;</button>
    <div class="modal-header">
      <img class="modal-art" src="${track.art}" alt="${track.album} cover" onerror="this.style.visibility='hidden'">
      <div>
        <div class="modal-title">${track.title}</div>
        <div class="modal-meta">${track.album}${track.year ? ' · ' + track.year : ''} · ${track.duration}${track.bpm ? ' · ' + track.bpm + ' BPM' : ''}</div>
        <div class="modal-meta">${track.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}</div>
      </div>
    </div>
    <div class="modal-links">
      ${buildLinksContent(track.links)}
    </div>
    ${track.recs.length ? `
      <div class="modal-recs-label">If you liked this, try —</div>
      ${track.recs.map(r => `
        <div class="modal-rec-item" data-title="${r.title}">
          <img class="modal-rec-art" src="${r.art}" alt="${r.album} cover" onerror="this.style.visibility='hidden'">
          <div class="modal-rec-info">
            <div class="rname">${r.title}</div>
            <div class="rmeta">${r.album}${r.year ? ' · ' + r.year : ''}</div>
          </div>
        </div>
      `).join('')}
    ` : ''}
  `;

  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay' || e.target.classList.contains('modal-close')) {
    closeModal();
    return;
  }
  const recItem = e.target.closest('.modal-rec-item');
  if (recItem) {
    const nextTrack = findTrackByTitle(recItem.dataset.title);
    if (nextTrack) openModal(nextTrack);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    document.getElementById('info-modal-overlay').classList.remove('open');
  }
});

document.getElementById('how-it-works-link').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('info-modal-card').innerHTML = `
    <button class="modal-close" aria-label="Close">&times;</button>
    <div class="modal-title">How this site works</div>
    <p class="modal-meta" style="margin-top: 16px; line-height: 1.6;">
      Every Stray Kids release is tagged by genre and tempo (BPM). Click any song to see its full details,
      plus a ranked list of similar tracks based on shared genres and matching tempo — click any of those
      to jump straight to that song's own page. Use the genre filters or search bar to narrow things down.
    </p>
  `;
  document.getElementById('info-modal-overlay').classList.add('open');
});

document.getElementById('info-modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'info-modal-overlay' || e.target.classList.contains('modal-close')) {
    document.getElementById('info-modal-overlay').classList.remove('open');
  }
});

fetch('data/songs.json')
  .then(res => res.json())
  .then(data => {
    computeRecommendations(data);
    allTracks = data;
    renderTracks(allTracks);
  })
  .catch(err => {
    console.error('Failed to load songs.json:', err);
    document.getElementById('tracklist').innerHTML =
      '<p style="padding: 24px; color: var(--text-dim);">Couldn\'t load the discography. Try refreshing.</p>';
  });

document.getElementById('tracklist').addEventListener('click', (e) => {
  const row = e.target.closest('.track-row');
  if (!row) return;
  const index = parseInt(row.dataset.i, 10);
  openModal(currentList[index]);
});

let currentGenre = 'All genres';
let currentSearch = '';

function applyFilters() {
  let filtered = allTracks;

  if (currentGenre !== 'All genres') {
    filtered = filtered.filter(t => t.genres.includes(currentGenre));
  }

  if (currentSearch.trim() !== '') {
    const query = currentSearch.trim().toLowerCase();
    filtered = filtered.filter(t => t.title.toLowerCase().includes(query));
  }

  renderTracks(filtered);
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentGenre = tab.textContent.trim();
    applyFilters();
  });
});

document.getElementById('search-box').addEventListener('input', (e) => {
  currentSearch = e.target.value;
  applyFilters();
});