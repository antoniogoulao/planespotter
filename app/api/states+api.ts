import { normaliseState } from '../../src/api/opensky-normalise';
import { Aircraft } from '../../src/types';

function basicAuth(): string {
  const id = process.env.OPENSKY_CLIENT_ID!;
  const secret = process.env.OPENSKY_CLIENT_SECRET!;
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
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
    const auth = basicAuth();
    const D_LAT = 50 / 111;
    const D_LON = 50 / (111 * Math.cos((lat * Math.PI) / 180));
    const url =
      `https://opensky-network.org/api/states/all` +
      `?lamin=${lat - D_LAT}&lamax=${lat + D_LAT}` +
      `&lomin=${lon - D_LON}&lomax=${lon + D_LON}`;

    const res = await fetch(url, {
      headers: { Authorization: auth },
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
