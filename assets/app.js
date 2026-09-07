function buildListenLinks(links) {
  const platforms = [
    { key: 'spotify', label: 'Spotify' },
    { key: 'appleMusic', label: 'Apple Music' },
    { key: 'youtube', label: 'YouTube' },
  ];

  const buttons = platforms
    .filter(p => links[p.key])
    .map(p => `<a class="listen-link" href="${links[p.key]}" target="_blank" rel="noopener noreferrer">${p.label}</a>`)
    .join('');

  if (!buttons) return '';
  return `<div class="listen-links">${buttons}</div>`;
}

function renderTracks(list) {
  const container = document.getElementById('tracklist');
  container.innerHTML = '';

  list.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = 'track';

    el.innerHTML = `
      <div class="track-row" data-i="${i}">
        <div class="tag-bar"></div>
        <img class="art" src="${t.art}" alt="${t.album} cover" onerror="this.style.visibility='hidden'">
        <div class="track-info">
          <div class="title">${t.title}</div>
          <div class="meta">
            ${t.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
            <span>${t.album}${t.year ? ' · ' + t.year : ''}</span>
          </div>
        </div>
        <div class="bpm">${t.bpm ?? '—'}${t.bpm ? '<span class="unit">BPM</span>' : ''}</div>
        <div class="tempo-tier">${t.tier}</div>
        <div class="chevron">&#9656;</div>
      </div>
      <div class="recs">
        ${buildListenLinks(t.links)}
        ${t.recs.length ? `
          <div class="recs-label">If you liked this, try —</div>
          ${t.recs.map(r => `
            <div class="rec-item">
              <div>
                <div class="rname">${r.name}</div>
                <div class="rmeta">${r.meta}</div>
              </div>
              <div class="rscore">${r.score}</div>
            </div>
          `).join('')}
        ` : ''}
      </div>
    `;
    container.appendChild(el);
  });
}

let allTracks = [];

fetch('data/songs.json')
  .then(res => res.json())
  .then(data => {
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
  const track = row.closest('.track');
  const wasOpen = track.classList.contains('open');
  document.querySelectorAll('.track.open').forEach(t => t.classList.remove('open'));
  if (!wasOpen) track.classList.add('open');
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const selectedGenre = tab.textContent.trim();

    if (selectedGenre === 'All genres') {
      renderTracks(allTracks);
      return;
    }

    const filtered = allTracks.filter(t => t.genres.includes(selectedGenre));
    renderTracks(filtered);
  });
});