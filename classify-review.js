import fs from 'fs';

const results = JSON.parse(fs.readFileSync('spotify-results.json', 'utf8'));

// strip parentheses, brackets, and punctuation to compare "core" titles
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, '')   // remove (...)
    .replace(/\[.*?\]/g, '')   // remove [...]
    .replace(/[^\w\s]/g, '')   // remove punctuation
    .trim()
    .replace(/\s+/g, ' ');
}

const flagged = results.filter(r => r.needsReview);

const likelySafe = [];
const likelyWrong = [];

for (const r of flagged) {
  const searched = normalize(r.title);
  const matched = normalize(r.matchedTrackName);

  // safe if one title contains the other after stripping extras
  if (matched.includes(searched) || searched.includes(matched)) {
    likelySafe.push(r);
  } else {
    likelyWrong.push(r);
  }
}

console.log(`${flagged.length} total flagged for review.`);
console.log(`${likelySafe.length} are likely fine (just extra credits/annotations) — no action needed.`);
console.log(`${likelyWrong.length} are likely genuine mismatches — these need a manual look:\n`);

likelyWrong.forEach(r => {
  console.log(`  "${r.title}" → matched "${r.matchedTrackName}"`);
});

fs.writeFileSync('spotify-likely-wrong.json', JSON.stringify(likelyWrong, null, 2));
console.log('\nSaved the manual-review list to spotify-likely-wrong.json');
