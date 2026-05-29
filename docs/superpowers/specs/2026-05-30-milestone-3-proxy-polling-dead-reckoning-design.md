# Milestone 3 — Proxy + Polling + Dead Reckoning Design

**Goal:** Replace mock aircraft with live ADS-B data from OpenSky Network, fetched via a server-side proxy that keeps credentials out of the app binary, polled every 10 s with 1 Hz dead-reckoning extrapolation between polls.

---

## Architecture

Three existing files are filled in or modified; two new files are created.

| File | Change |
|---|---|
| `app/api/states+api.ts` | CREATE — Expo API route (server-side); holds credentials, proxies OpenSky |
| `src/api/opensky.ts` | FILL IN — client-side module; calls the proxy, returns `Aircraft[]` |
| `src/hooks/useAircraft.ts` | FILL IN — polling + dead-reckoning hook |
| `app/radar.tsx` | MODIFY — swap mock constant for `useAircraft(location)` |
| `.env.example` | CREATE — documents required env vars |

The proxy route runs in Node.js (server-side Expo Router) and is never bundled into the iOS/Android binary. The client module calls it via a relative URL (`/api/states`), which Expo Router resolves correctly in both dev and production.

---

## Proxy Route — `app/api/states+api.ts`

### Request

`GET /api/states?lat={lat}&lon={lon}`

Both params are required. Returns 400 if missing.

### Token management

OAuth2 client credentials flow against OpenSky:

```
POST https://opensky-network.org/api/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=${OPENSKY_CLIENT_ID}
&client_secret=${OPENSKY_CLIENT_SECRET}
```

The token and its expiry are cached in a module-level variable. On each request the proxy checks if the token expires within the next 60 s and refreshes it if so.

### Bounding box

Approximately 50 km square centred on the device:

```
const D_LAT = 50 / 111;                              // ≈ 0.45°
const D_LON = 50 / (111 * Math.cos(lat * Math.PI / 180));
lamin = lat - D_LAT,  lamax = lat + D_LAT
lomin = lon - D_LON,  lomax = lon + D_LON
```

### OpenSky query

`GET https://opensky-network.org/api/states/all?lamin=…&lamax=…&lomin=…&lomax=…`

Authorization header: `Bearer {token}`

### Response normalisation

OpenSky returns a `states` array of 17-element arrays. Indices used:

| Index | Field | Mapped to |
|---|---|---|
| 0 | icao24 | `icao24` |
| 1 | callsign | `callsign` (trimmed) |
| 4 | last_contact (unix s) | `lastUpdate` (× 1000 → ms) |
| 5 | longitude | `lon` |
| 6 | latitude | `lat` |
| 7 | baro_altitude (m) | `alt` |
| 8 | on_ground | filter: skip if true |
| 9 | velocity (m/s) | `velocity` |
| 10 | true_track (°) | `heading` |
| 11 | vertical_rate (m/s) | `verticalRate` |

Entries are dropped if: `on_ground === true`, `lat == null`, `lon == null`, or `alt == null`.

### Response shape

```json
{ "aircraft": [ Aircraft, … ] }
```

On upstream error (OpenSky 4xx/5xx): proxy returns that status with `{ "error": "…" }`.
On missing env vars: returns 500 `{ "error": "OpenSky credentials not configured" }`.

---

## Client API — `src/api/opensky.ts`

```ts
export async function fetchAircraft(lat: number, lon: number): Promise<Aircraft[]>
```

- Calls `fetch('/api/states?lat=${lat}&lon=${lon}')`
- On non-200 response: throws an `Error` with the response status
- On success: returns `data.aircraft`

---

## Hook — `src/hooks/useAircraft.ts`

```ts
export function useAircraft(location: { lat: number; lon: number } | null): Aircraft[]
```

### Internal state

| Name | Type | Purpose |
|---|---|---|
| `store` | `useRef<Map<string, Aircraft>>` | Last-known aircraft from OpenSky, keyed by `icao24` |
| `aircraft` | `useState<Aircraft[]>` | Dead-reckoned positions — what callers see |

### Poll timer (10 s, fires immediately on mount)

1. Calls `fetchAircraft(location.lat, location.lon)`
2. For each returned aircraft: upserts into `store.current` with `lastUpdate = Date.now()`
3. Evicts stale entries: removes aircraft where `(Date.now() - lastUpdate) > 60_000` — transponder has gone silent
4. On fetch error: swallows the error, store unchanged

### Dead-reckoning timer (1 s)

For each aircraft in `store.current`:

```ts
const elapsed = (Date.now() - ac.lastUpdate) / 1000;  // seconds
const pos = offsetPosition(
  { lat: ac.lat, lon: ac.lon },
  ac.heading,
  ac.velocity * elapsed,
);
return { ...ac, lat: pos.lat, lon: pos.lon };
```

Sets `aircraft` state with the extrapolated array. This is the only `setState` call, so re-renders happen at 1 Hz.

### Lifecycle

- When `location` becomes non-null, `useEffect` fires: first poll runs immediately (direct call, no delay), then a 10 s `setInterval` handles subsequent polls. The 1 s dead-reckoning `setInterval` also starts immediately.
- Both interval IDs are stored in refs and cleared in the `useEffect` cleanup.
- Returns `[]` when `location` is null — the effect does not run.

---

## `radar.tsx` update

Remove: `MOCK_OFFSETS`, `MOCK_BASE`, `AircraftBase`, `offsetMockAircraft`, `offsetPosition` import.

Add: `import { useAircraft } from '../src/hooks/useAircraft';`

Replace:
```ts
const aircraft = location ? offsetMockAircraft(location) : [];
```
With:
```ts
const aircraft = useAircraft(location);
```

Everything else in the file is unchanged.

---

## Environment

**`.env.example`** (committed):
```
OPENSKY_CLIENT_ID=your_client_id_here
OPENSKY_CLIENT_SECRET=your_client_secret_here
```

User creates `.env.local` (gitignored by Expo) with real values. The proxy reads them via `process.env.OPENSKY_CLIENT_ID` and `process.env.OPENSKY_CLIENT_SECRET`.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `.env.local` missing / env vars absent | Proxy returns 500; hook swallows error; radar shows last known or empty |
| OpenSky 429 / 5xx | Proxy forwards status; hook swallows error; last known positions held |
| Token expired mid-session | Refreshed automatically on the next proxy request |
| Network unreachable | `fetchAircraft` throws; hook swallows; last known positions held |
| Aircraft exits bounding box or transponder off | Evicted from store after 60 s of no `lastContact` |
| `location === null` | No timers run, `useAircraft` returns `[]` immediately |
| All fields null from OpenSky | Entry filtered at normalisation layer in proxy |

---

## Acceptance Criteria

- [ ] `npx expo run:ios --device` builds and runs
- [ ] With valid `.env.local`, live aircraft appear on the radar within 10 s of opening the Radar screen
- [ ] Aircraft positions glide smoothly between polls (dead reckoning visible over 10 s)
- [ ] Aircraft that leave the bounding box disappear within ~60 s
- [ ] No credentials appear in the compiled app binary
- [ ] `npx tsc --noEmit` passes
- [ ] All existing tests pass
