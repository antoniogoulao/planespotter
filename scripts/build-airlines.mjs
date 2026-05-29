// Generates assets/airlines.json from the OpenFlights airlines database.
// Output shape: { "<ICAO>": { "name": string, "iata": string }, ... }
// Run with:  node scripts/build-airlines.mjs
//
// The map is keyed by the 3-letter ICAO designator because that is the prefix
// of an ADS-B callsign (e.g. "TAP1124" -> "TAP"). See src/lib/airlines.ts.

import { writeFile, mkdir } from 'node:fs/promises';

const SOURCE = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat';
const OUT = new URL('../assets/airlines.json', import.meta.url);

// Parse one OpenFlights CSV line: comma-separated, fields may be quoted,
// and the literal \N denotes null.
function parseLine(line) {
  const out = [];
  let field = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(field); field = '';
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out.map((f) => (f === '\\N' ? '' : f));
}

const ICAO_RE = /^[A-Z]{3}$/;
const IATA_RE = /^[A-Z0-9]{2}$/;

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`download failed: ${res.status}`);
const text = await res.text();

const map = {};
let kept = 0;
for (const raw of text.split('\n')) {
  if (!raw.trim()) continue;
  const [, name, , iataRaw, icaoRaw, , , activeRaw] = parseLine(raw);
  const icao = (icaoRaw || '').toUpperCase();
  if (!ICAO_RE.test(icao)) continue;          // need a clean 3-letter ICAO code
  if (!name || name === 'Unknown') continue;
  const iata = IATA_RE.test((iataRaw || '').toUpperCase()) ? iataRaw.toUpperCase() : '';
  const active = activeRaw === 'Y';

  const existing = map[icao];
  // Prefer active carriers when an ICAO code is reused by a defunct one.
  if (existing && !(active && !existing.active)) continue;
  map[icao] = { name, iata, active };
  kept++;
}

// Drop the helper flag and emit sorted keys for stable diffs.
const sorted = {};
for (const code of Object.keys(map).sort()) {
  sorted[code] = { name: map[code].name, iata: map[code].iata };
}

await mkdir(new URL('../assets/', import.meta.url), { recursive: true });
await writeFile(OUT, JSON.stringify(sorted, null, 2) + '\n');
console.log(`Wrote ${Object.keys(sorted).length} airlines to assets/airlines.json (kept ${kept} of source rows)`);
