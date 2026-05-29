import { normaliseState } from '../../src/api/opensky-normalise';
import { Aircraft } from '../../src/types';

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }
  const res = await fetch('https://opensky-network.org/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.OPENSKY_CLIENT_ID!,
      client_secret: process.env.OPENSKY_CLIENT_SECRET!,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return tokenCache.token;
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');

  if (isNaN(lat) || isNaN(lon)) {
    return Response.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return Response.json(
      { error: 'OpenSky credentials not configured' },
      { status: 500 },
    );
  }

  try {
    const token = await getToken();
    const D_LAT = 50 / 111;
    const D_LON = 50 / (111 * Math.cos((lat * Math.PI) / 180));
    const url =
      `https://opensky-network.org/api/states/all` +
      `?lamin=${lat - D_LAT}&lamax=${lat + D_LAT}` +
      `&lomin=${lon - D_LON}&lomax=${lon + D_LON}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return Response.json(
        { error: `OpenSky error ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json() as { states?: unknown[][] };
    const aircraft: Aircraft[] = (data.states ?? [])
      .map((s) => normaliseState(s))
      .filter((a): a is Aircraft => a !== null);

    return Response.json({ aircraft });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
