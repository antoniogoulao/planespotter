# Milestone 3 — Proxy + Polling + Dead Reckoning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock aircraft with live ADS-B data from OpenSky Network, proxied server-side to keep credentials out of the app binary, polled every 10 s, with 1 Hz dead-reckoning extrapolation between polls.

**Architecture:** An Expo Router API route (`app/api/states+api.ts`) holds credentials, gets an OAuth2 token, and queries OpenSky with a bounding box. A thin client module (`src/api/opensky.ts`) calls that route. `useAircraft` polls every 10 s via a ref-based location (so GPS drift doesn't restart timers), dead-reckons at 1 Hz, and returns `Aircraft[]`. `radar.tsx` swaps its mock constant for `useAircraft(location)`.

**Tech Stack:** Expo Router API routes (server-side Node.js), OpenSky REST API + OAuth2, TypeScript strict, jest-expo.

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/api/opensky-normalise.ts` | Pure function: maps an OpenSky state vector array to `Aircraft \| null` |
| Create | `app/api/states+api.ts` | Expo API route: OAuth2 token, OpenSky query, normalise, return JSON |
| Create | `.env.example` | Documents `OPENSKY_CLIENT_ID` and `OPENSKY_CLIENT_SECRET` |
| Fill in | `src/api/opensky.ts` | Client: `fetchAircraft(lat, lon)` calls `/api/states` |
| Fill in | `src/hooks/useAircraft.ts` | Polling + dead-reckoning hook |
| Modify | `app/radar.tsx` | Swap mock constant for `useAircraft(location)` |
| Create | `__tests__/opensky-normalise.test.ts` | Unit tests for normaliseState |
| Create | `__tests__/opensky.test.ts` | Unit tests for fetchAircraft |
| Create | `__tests__/useAircraft.test.ts` | Unit tests for deadReckon |

---

## Context for all tasks

`Aircraft` type (from `src/types.ts`, already implemented):
```ts
interface Aircraft {
  icao24: string; callsign: string;
  lat: number; lon: number; alt: number;
  velocity: number; heading: number; verticalRate: number;
  lastUpdate: number; // ms epoch
}
```

`offsetPosition(from: Geo, bearing: number, metres: number): Geo` is exported from `src/lib/geo.ts`.

---

### Task 1: `opensky-normalise.ts` — pure state-vector mapper

**Files:**
- Create: `src/api/opensky-normalise.ts`
- Create: `__tests__/opensky-normalise.test.ts`

OpenSky state vector indices used:

| Index | Field | Maps to |
|---|---|---|
| 0 | icao24 | `icao24` |
| 1 | callsign | `callsign` (trimmed) |
| 4 | last_contact (unix s) | `lastUpdate` (× 1000 ms) |
| 5 | longitude | `lon` |
| 6 | latitude | `lat` |
| 7 | baro_altitude (m) | `alt` |
| 8 | on_ground | filter — skip if `true` |
| 9 | velocity (m/s) | `velocity` |
| 10 | true_track (°) | `heading` |
| 11 | vertical_rate (m/s) | `verticalRate` |

---

- [ ] **Step 1.1: Write failing tests**

Create `__tests__/opensky-normalise.test.ts`:

```ts
import { normaliseState } from '../src/api/opensky-normalise';

const VALID: unknown[] = [
  'abc123', 'BAW001 ', 'UK', 999, 1000,
  -0.1, 51.5, 8000, false, 250, 90, -5,
  null, 8200, '1234', false, 0,
];

describe('normaliseState', () => {
  it('maps a valid state vector to Aircraft', () => {
    const result = normaliseState(VALID);
    expect(result).toMatchObject({
      icao24: 'abc123',
      callsign: 'BAW001',
      lat: 51.5,
      lon: -0.1,
      alt: 8000,
      velocity: 250,
      heading: 90,
      verticalRate: -5,
      lastUpdate: 1_000_000,
    });
  });

  it('returns null when on_ground is true', () => {
    const s = [...VALID]; s[8] = true;
    expect(normaliseState(s)).toBeNull();
  });

  it('returns null when lat is null', () => {
    const s = [...VALID]; s[6] = null;
    expect(normaliseState(s)).toBeNull();
  });

  it('returns null when lon is null', () => {
    const s = [...VALID]; s[5] = null;
    expect(normaliseState(s)).toBeNull();
  });

  it('returns null when alt is null', () => {
    const s = [...VALID]; s[7] = null;
    expect(normaliseState(s)).toBeNull();
  });

  it('trims callsign whitespace', () => {
    const s = [...VALID]; s[1] = '  RYR123 ';
    expect(normaliseState(s)?.callsign).toBe('RYR123');
  });

  it('defaults velocity/heading/verticalRate to 0 when null', () => {
    const s = [...VALID]; s[9] = null; s[10] = null; s[11] = null;
    const r = normaliseState(s);
    expect(r?.velocity).toBe(0);
    expect(r?.heading).toBe(0);
    expect(r?.verticalRate).toBe(0);
  });
});
```

- [ ] **Step 1.2: Run tests — confirm all fail**

```bash
npm test -- --testPathPattern=opensky-normalise
```

Expected: 7 tests FAIL (`normaliseState` not found).

- [ ] **Step 1.3: Implement `src/api/opensky-normalise.ts`**

```ts
import { Aircraft } from '../types';

export function normaliseState(s: unknown[]): Aircraft | null {
  const onGround = s[8];
  const lat = s[6];
  const lon = s[5];
  const alt = s[7];
  if (onGround === true || lat == null || lon == null || alt == null) return null;
  return {
    icao24: String(s[0]),
    callsign: String(s[1] ?? '').trim(),
    lat: Number(lat),
    lon: Number(lon),
    alt: Number(alt),
    velocity: Number(s[9] ?? 0),
    heading: Number(s[10] ?? 0),
    verticalRate: Number(s[11] ?? 0),
    lastUpdate: Number(s[4] ?? 0) * 1000,
  };
}
```

- [ ] **Step 1.4: Run tests — confirm all pass**

```bash
npm test -- --testPathPattern=opensky-normalise
```

Expected: 7/7 PASS.

- [ ] **Step 1.5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.6: Commit**

```bash
git add src/api/opensky-normalise.ts __tests__/opensky-normalise.test.ts
git commit -m "feat(M3): add normaliseState pure function with tests"
```

---

### Task 2: `app/api/states+api.ts` — OpenSky proxy route

**Files:**
- Create: `app/api/states+api.ts`
- Create: `.env.example`

The Expo Router API route runs server-side (Node.js). It reads credentials from `process.env`, manages an OAuth2 token in module memory, and proxies OpenSky.

---

- [ ] **Step 2.1: Create `.env.example`**

```
OPENSKY_CLIENT_ID=your_client_id_here
OPENSKY_CLIENT_SECRET=your_client_secret_here
```

User copies this to `.env.local` and fills in real values. Expo reads `.env.local` automatically.

- [ ] **Step 2.2: Create `app/api/` directory and implement the route**

```bash
mkdir -p app/api
```

Create `app/api/states+api.ts`:

```ts
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
```

- [ ] **Step 2.3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.4: Run all tests — confirm no regressions**

```bash
npm test
```

Expected: all previous tests still pass.

- [ ] **Step 2.5: Commit**

```bash
git add app/api/states+api.ts .env.example
git commit -m "feat(M3): add OpenSky proxy API route with OAuth2 token management"
```

---

### Task 3: `src/api/opensky.ts` — client module

**Files:**
- Fill in: `src/api/opensky.ts` (currently stub: `// Milestone 3\nexport {};`)
- Create: `__tests__/opensky.test.ts`

---

- [ ] **Step 3.1: Write failing tests**

Create `__tests__/opensky.test.ts`:

```ts
import { fetchAircraft } from '../src/api/opensky';

const MOCK_AIRCRAFT = [
  {
    icao24: 'abc123', callsign: 'BAW001',
    lat: 51.5, lon: -0.1, alt: 8000,
    velocity: 250, heading: 90, verticalRate: -5, lastUpdate: 1_000_000,
  },
];

describe('fetchAircraft', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the correct URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ aircraft: [] }),
    });
    await fetchAircraft(51.5, -0.1);
    expect(global.fetch).toHaveBeenCalledWith('/api/states?lat=51.5&lon=-0.1');
  });

  it('returns the aircraft array on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ aircraft: MOCK_AIRCRAFT }),
    });
    const result = await fetchAircraft(51.5, -0.1);
    expect(result).toEqual(MOCK_AIRCRAFT);
  });

  it('throws on non-200 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
    });
    await expect(fetchAircraft(51.5, -0.1)).rejects.toThrow('fetchAircraft failed: 429');
  });
});
```

- [ ] **Step 3.2: Run tests — confirm all fail**

```bash
npm test -- --testPathPattern=opensky.test
```

Expected: 3 tests FAIL (`fetchAircraft` not exported).

- [ ] **Step 3.3: Implement `src/api/opensky.ts`**

```ts
import { Aircraft } from '../types';

export async function fetchAircraft(lat: number, lon: number): Promise<Aircraft[]> {
  const res = await fetch(`/api/states?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error(`fetchAircraft failed: ${res.status}`);
  const data = await res.json() as { aircraft: Aircraft[] };
  return data.aircraft;
}
```

- [ ] **Step 3.4: Run tests — confirm all pass**

```bash
npm test -- --testPathPattern=opensky.test
```

Expected: 3/3 PASS.

- [ ] **Step 3.5: Run all tests — confirm no regressions**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3.6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.7: Commit**

```bash
git add src/api/opensky.ts __tests__/opensky.test.ts
git commit -m "feat(M3): implement fetchAircraft client with tests"
```

---

### Task 4: `src/hooks/useAircraft.ts` — polling + dead reckoning

**Files:**
- Fill in: `src/hooks/useAircraft.ts` (currently stub: `// Milestone 3\nexport {};`)
- Create: `__tests__/useAircraft.test.ts`

The `deadReckon` function is exported so it can be tested independently. The hook uses a `useRef` for location (so GPS drift doesn't restart intervals) and runs timers for the component lifetime.

---

- [ ] **Step 4.1: Write failing tests**

Create `__tests__/useAircraft.test.ts`:

```ts
import { deadReckon } from '../src/hooks/useAircraft';
import { haversineDistance } from '../src/lib/geo';

const BASE = {
  icao24: 'abc', callsign: 'TST',
  lat: 51.5, lon: -0.1, alt: 10000,
  velocity: 250, heading: 0, verticalRate: 0,
  lastUpdate: 1000,
};

describe('deadReckon', () => {
  it('returns aircraft unchanged when elapsed is 0', () => {
    const r = deadReckon(BASE, 1000);
    expect(r.lat).toBe(51.5);
    expect(r.lon).toBe(-0.1);
  });

  it('moves aircraft north (heading 0°) at 250 m/s for 10 s → ~2500 m', () => {
    const r = deadReckon(BASE, 11_000); // 10 s later
    const dist = haversineDistance({ lat: BASE.lat, lon: BASE.lon }, r);
    expect(dist).toBeCloseTo(2500, -1); // within ~100 m
    expect(r.lat).toBeGreaterThan(BASE.lat);
  });

  it('does not move when velocity is 0', () => {
    const r = deadReckon({ ...BASE, velocity: 0 }, 2000);
    expect(r.lat).toBe(BASE.lat);
    expect(r.lon).toBe(BASE.lon);
  });

  it('preserves all other fields', () => {
    const r = deadReckon(BASE, 2000);
    expect(r.icao24).toBe(BASE.icao24);
    expect(r.callsign).toBe(BASE.callsign);
    expect(r.alt).toBe(BASE.alt);
    expect(r.velocity).toBe(BASE.velocity);
    expect(r.heading).toBe(BASE.heading);
    expect(r.lastUpdate).toBe(BASE.lastUpdate);
  });
});
```

- [ ] **Step 4.2: Run tests — confirm all fail**

```bash
npm test -- --testPathPattern=useAircraft
```

Expected: 4 tests FAIL (`deadReckon` not exported).

- [ ] **Step 4.3: Implement `src/hooks/useAircraft.ts`**

```ts
import { useEffect, useRef, useState } from 'react';
import { Aircraft } from '../types';
import { fetchAircraft } from '../api/opensky';
import { offsetPosition } from '../lib/geo';

const POLL_MS = 10_000;
const DR_MS = 1_000;
const STALE_MS = 60_000;

export function deadReckon(ac: Aircraft, nowMs: number): Aircraft {
  const elapsed = (nowMs - ac.lastUpdate) / 1000;
  if (elapsed <= 0) return ac;
  const pos = offsetPosition(
    { lat: ac.lat, lon: ac.lon },
    ac.heading,
    ac.velocity * elapsed,
  );
  return { ...ac, lat: pos.lat, lon: pos.lon };
}

export function useAircraft(
  location: { lat: number; lon: number } | null,
): Aircraft[] {
  const store = useRef<Map<string, Aircraft>>(new Map());
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const locRef = useRef(location);
  locRef.current = location; // always reflects latest location without restarting timers

  useEffect(() => {
    async function poll() {
      const loc = locRef.current;
      if (!loc) return;
      try {
        const fresh = await fetchAircraft(loc.lat, loc.lon);
        const now = Date.now();
        fresh.forEach(ac => store.current.set(ac.icao24, { ...ac, lastUpdate: now }));
        for (const [id, ac] of store.current) {
          if (now - ac.lastUpdate > STALE_MS) store.current.delete(id);
        }
      } catch {
        // keep last known data on network error
      }
    }

    function tick() {
      if (!locRef.current) return;
      const now = Date.now();
      setAircraft(
        Array.from(store.current.values()).map(ac => deadReckon(ac, now)),
      );
    }

    poll();
    tick();
    const pollId = setInterval(poll, POLL_MS);
    const drId = setInterval(tick, DR_MS);

    return () => {
      clearInterval(pollId);
      clearInterval(drId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return aircraft;
}
```

- [ ] **Step 4.4: Run tests — confirm all pass**

```bash
npm test -- --testPathPattern=useAircraft
```

Expected: 4/4 PASS.

- [ ] **Step 4.5: Run all tests — confirm no regressions**

```bash
npm test
```

Expected: all tests pass (14 existing + 7 + 3 + 4 new = 28 total).

- [ ] **Step 4.6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.7: Commit**

```bash
git add src/hooks/useAircraft.ts __tests__/useAircraft.test.ts
git commit -m "feat(M3): implement useAircraft polling hook with dead reckoning"
```

---

### Task 5: Update `app/radar.tsx` — swap mock for live data

**Files:**
- Modify: `app/radar.tsx`

Remove all mock aircraft code. Import and call `useAircraft`.

---

- [ ] **Step 5.1: Replace `app/radar.tsx`**

```tsx
import { StyleSheet, Text, View } from 'react-native';
import { useLocation } from '../src/hooks/useLocation';
import { useDeviceOrientation } from '../src/hooks/useDeviceOrientation';
import { RadarView } from '../src/components/RadarView';
import { useAircraft } from '../src/hooks/useAircraft';

export default function RadarScreen() {
  const { coords, error } = useLocation();
  const orientation = useDeviceOrientation();

  const location = coords ? { lat: coords.lat, lon: coords.lon } : null;
  const azimuth = orientation?.azimuth ?? null;
  const aircraft = useAircraft(location);

  if (error) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RadarView location={location} azimuth={azimuth} aircraft={aircraft} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  error: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#ef4444', fontSize: 14 },
});
```

- [ ] **Step 5.2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5.3: Run all tests**

```bash
npm test
```

Expected: 28/28 PASS.

- [ ] **Step 5.4: Commit**

```bash
git add app/radar.tsx
git commit -m "feat(M3): wire RadarScreen to useAircraft — replace mock aircraft with live data"
```

---

### Task 6: Add credentials and verify on device

- [ ] **Step 6.1: Create `.env.local` with real credentials**

```bash
# Create this file — it is gitignored by Expo
cat > .env.local << 'EOF'
OPENSKY_CLIENT_ID=your_actual_client_id
OPENSKY_CLIENT_SECRET=your_actual_client_secret
EOF
```

Replace the placeholder values with the real OpenSky credentials.

- [ ] **Step 6.2: Run on device**

```bash
npx expo run:ios --device
```

Expected: app builds and installs.

- [ ] **Step 6.3: Verify acceptance criteria on device**

Open the Radar screen and check:

- [ ] Live aircraft appear on the radar within 10 s of GPS fix
- [ ] Aircraft positions glide smoothly between polls (watch a blip for 30 s)
- [ ] Aircraft that fly out of range disappear within ~60 s
- [ ] Radar is empty / shows "Locating…" before GPS fix, not a crash
- [ ] If Wi-Fi is turned off, last known aircraft stay visible (no crash, no clear)
- [ ] `npx tsc --noEmit` still passes

---

## Self-Review

**Spec coverage:**
- ✅ Proxy route with OAuth2 token (cached, refreshed before expiry)
- ✅ Bounding box: `lat ± 50/111`, `lon ± 50/(111 * cos(lat))`
- ✅ State vector normalisation: correct indices, on_ground filter, null checks, callsign trim
- ✅ `fetchAircraft(lat, lon): Promise<Aircraft[]>` with error throw
- ✅ `useAircraft` polls every 10 s, dead-reckons at 1 Hz
- ✅ `deadReckon` exported and tested
- ✅ Stale eviction after 60 s without `lastUpdate`
- ✅ Fetch errors swallowed, last known data held
- ✅ Location accessed via ref — GPS drift doesn't restart timers
- ✅ `radar.tsx` replaces mock with `useAircraft(location)` — mock constants removed
- ✅ `.env.example` documents required env vars
- ✅ Missing env vars → 500 response
- ✅ OpenSky 4xx/5xx → forwarded status

**Placeholder scan:** None found.

**Type consistency:**
- `normaliseState` returns `Aircraft | null` — matches `Aircraft` from `src/types.ts` ✓
- `fetchAircraft` returns `Promise<Aircraft[]>` — matches `useAircraft` store type `Map<string, Aircraft>` ✓
- `deadReckon(ac: Aircraft, nowMs: number): Aircraft` — used inside `useAircraft`, tested independently ✓
- `useAircraft` returns `Aircraft[]` — same type `RadarView` expects for its `aircraft` prop ✓
- `store.current.set(ac.icao24, { ...ac, lastUpdate: now })` — `lastUpdate` is `number` (ms) ✓
