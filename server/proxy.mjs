/**
 * Standalone OpenSky proxy server for development.
 * Run with: node server/proxy.mjs
 * Listens on port 3001. The app connects via the Mac's LAN IP (auto-detected
 * from expo-constants in src/api/opensky.ts).
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

// ── Load .env.local ──────────────────────────────────────────────────────────
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
try {
  for (const line of readFileSync(resolve(ROOT, '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch { /* .env.local not found */ }

const CLIENT_ID = process.env.OPENSKY_CLIENT_ID;
const CLIENT_SECRET = process.env.OPENSKY_CLIENT_SECRET;
const PORT = 3001;

// ── OAuth2 token cache ───────────────────────────────────────────────────────
let tokenCache = null;

async function getToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const res = await fetch('https://auth.opensky-network.org/realms/opensky/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const data = await res.json();
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  console.log('[proxy] token refreshed');
  return tokenCache.token;
}

// ── Normalise OpenSky state vector ───────────────────────────────────────────
function normaliseState(s) {
  if (s[8] === true || s[6] == null || s[5] == null || s[7] == null) return null;
  return {
    icao24: String(s[0]),
    callsign: String(s[1] ?? '').trim(),
    lat: Number(s[6]),
    lon: Number(s[5]),
    alt: Number(s[7]),
    velocity: Number(s[9] ?? 0),
    heading: Number(s[10] ?? 0),
    verticalRate: Number(s[11] ?? 0),
    lastUpdate: Number(s[4] ?? 0) * 1000,
  };
}

// ── HTTP server ──────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/api/states') {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not found' }));
    return;
  }

  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lon = parseFloat(url.searchParams.get('lon') ?? '');
  if (isNaN(lat) || isNaN(lon)) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'lat and lon are required' }));
    return;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET not set in .env.local' }));
    return;
  }

  try {
    const token = await getToken();
    const D_LAT = 50 / 111;
    const D_LON = 50 / (111 * Math.cos((lat * Math.PI) / 180));
    const osUrl =
      `https://opensky-network.org/api/states/all` +
      `?lamin=${lat - D_LAT}&lamax=${lat + D_LAT}` +
      `&lomin=${lon - D_LON}&lomax=${lon + D_LON}`;

    console.log(`[proxy] GET ${osUrl.slice(0, 80)}...`);
    const osRes = await fetch(osUrl, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`[proxy] OpenSky status: ${osRes.status}`);
    if (!osRes.ok) {
      res.writeHead(osRes.status);
      res.end(JSON.stringify({ error: `OpenSky ${osRes.status}` }));
      return;
    }

    const data = await osRes.json();
    const aircraft = (data.states ?? []).map(normaliseState).filter(Boolean);
    console.log(`[proxy] returning ${aircraft.length} aircraft`);
    res.writeHead(200);
    res.end(JSON.stringify({ aircraft }));
  } catch (err) {
    console.error('[proxy] error:', err.message);
    res.writeHead(502);
    res.end(JSON.stringify({ error: String(err) }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[proxy] listening on port ${PORT}`);
  console.log(`[proxy] credentials: CLIENT_ID=${CLIENT_ID ? '✓' : '✗ MISSING'}  CLIENT_SECRET=${CLIENT_SECRET ? '✓' : '✗ MISSING'}`);
});
