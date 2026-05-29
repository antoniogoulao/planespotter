# PlaneSpotter — Build Spec

An AR airplane tracker for iOS and Android. Point the phone at the sky; live aircraft
appear as labelled markers overlaid on the camera feed, positioned by where the device
is actually aimed. Same idea as Star Walk 2, but the catalog is live ADS-B data instead
of stars. Each marker carries a tag with the airline logo (or a military / N/A badge),
callsign, departure → destination airports, and altitude.

This document is the source of truth for the build. Follow the milestones in order.
Each milestone has acceptance criteria — do not move past one until it passes on a
**physical device** (the simulator has no magnetometer and no camera, so most of this is
untestable in an emulator).

---

## Tech stack (pinned)

- **Expo SDK 56** (React Native 0.85, React 19.2.3). Requires **Node.js 22.13+**.
- **Expo Router** (default in SDK 56), TypeScript.
- Core packages: `expo-sensors`, `expo-location`, `expo-camera`, `expo-image`, `react-native-svg`.
- **Localization**: `expo-localization` (device locale), `i18next` + `react-i18next` (translations),
  `@react-native-async-storage/async-storage` (persist the chosen language). See the i18n section.
- **Route data**: the adsbdb public API (plain `fetch`, no package, no key).
- **Optional, for visual detection (Milestone 9):** `react-native-vision-camera`,
  `react-native-fast-tflite`. These replace `expo-camera` on the AR screen only — see that milestone.
- **A development build is mandatory** — neither the camera nor the detection libs run in
  Expo Go. Use `npx expo run:android` / `npx expo run:ios` to install a dev client on a real device.

```bash
npx create-expo-app@latest planespotter
cd planespotter
npx expo install expo-sensors expo-location expo-camera expo-image react-native-svg \
  expo-localization @react-native-async-storage/async-storage
npm i i18next react-i18next
```

There is **no user login** in this app. The only authentication is OpenSky's (machine-to-machine,
below); the app never asks a person to sign in.

---

## Authentication — OpenSky only (OAuth2 client credentials)

This is machine-to-machine auth for the data source, NOT a user login. As of 18 March 2026,
OpenSky removed basic auth and requires the OAuth2 **client credentials** flow:
1. Register at https://opensky-network.org/ and open the Account page.
2. Create an API client → receive a `client_id` and `client_secret`.
3. POST them to the token endpoint to get a bearer token (valid ~30 min), then send it as
   `Authorization: Bearer <token>` on every API request.
4. Anonymous access still works but with much tighter rate limits.

Token endpoint:
`https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token`

**CRITICAL — never ship the `client_secret` in the app binary.** It can be extracted from a
mobile app trivially. Hold it server-side. Expo SDK 56 ships server / API routes, so the clean
pattern is a tiny Expo API route that owns the secret, mints the token, and proxies the OpenSky
call. The app calls your own route; the secret never leaves the server. For solo on-device
testing only, you may temporarily put credentials in env and call OpenSky directly — but the
proxy is the real design and Milestone 3 implements it.

### Token fetch (server side — Expo API route, e.g. `app/api/states+api.ts`)
```ts
const TOKEN_URL =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
let cached: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  if (cached && Date.now() < cached.exp - 60_000) return cached.token;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.OPENSKY_CLIENT_ID!,
    client_secret: process.env.OPENSKY_CLIENT_SECRET!,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const json = await res.json();
  cached = { token: json.access_token, exp: Date.now() + json.expires_in * 1000 };
  return cached.token;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = await getToken();
  const r = await fetch(`https://opensky-network.org/api/states/all?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## Hard constraints / gotchas (read before coding)

1. **Physical device only.** No useful testing in a simulator.
2. **Two coordinate systems must share one frame.** Both the device's pointing direction and
   every plane's position are reduced to `(azimuth, elevation)` in degrees: azimuth 0–360°
   clockwise from **true north**, elevation degrees above the horizon.
3. **Magnetic vs true north.** Magnetometer reads magnetic north; GPS/ADS-B is true north.
   Apply local magnetic declination to the device heading.
4. **Sensor axis signs differ by platform and hold orientation.** Expect to flip a sign or swap
   an axis after testing on-device. The debug readout (Milestone 1) makes this quick.
5. **OpenSky is rate-limited and auth'd.** Go through the proxy, poll every 5–10 s, keep the box
   ≤1°, interpolate between polls (dead reckoning), handle HTTP 429. Verify current limits at
   https://openskynetwork.github.io/opensky-api/rest.html
6. **Don't debug the math and the sensors at the same time.** That's why the 2D radar
   (Milestone 2) comes before AR (Milestone 6).
7. **Airline logos are trademarks.** Showing them to identify a flight is normal for a hobby app;
   if you publish, check usage terms. Bundle a curated local pack rather than hot-linking a CDN.
8. **Routes are not in the ADS-B feed and are often missing.** Origin/destination come from a
   separate callsign lookup (adsbdb). Scheduled airliners resolve well; military / unscheduled
   flights frequently return 404 — the tag must render fine with no route.
9. **Locale formatting needs ICU data.** Number/date formatting uses `Intl`. Hermes ships `Intl`
   but Android locale data can be incomplete; if `Intl.NumberFormat` misbehaves for some locales,
   add the `@formatjs/intl-*` polyfills with data for the eight supported locales. Verify on a
   real Android device, not just iOS.

---

## Architecture — two streams converging

```
WHERE AM I LOOKING?                    WHERE ARE THE PLANES?
  Magnetometer + accelerometer           GPS (expo-location)
        |                                       |
  useDeviceOrientation()                  proxy route -> OpenSky (bbox)
        |                                       |
  device { azimuth, elevation }           aircraft [{ lat, lon, alt, callsign, ... }]
        |                                       |
        |                          identify(callsign) -> airline / military / N/A
        |                          fetchRoute(callsign) -> origin/dest (adsbdb, cached)
        |                          lookAngles(me, plane) -> azimuth, elevation
        \____________________  __________________/
                             \/
              projectToScreen(plane, device, W, H) -> {x,y} | null
                             |
              AR overlay: sprite at {x,y} + tag (logo, callsign, route, altitude)
              (Milestone 9: snap sprite to detected pixels when visible)
```

---

## Proposed file structure

```
planespotter/
  app/
    _layout.tsx
    index.tsx            # Home: pick Radar / AR, show permission state
    radar.tsx            # Milestone 2: 2D top-down view
    ar.tsx               # Milestone 6: AR camera overlay
    api/
      states+api.ts      # Milestone 3: OpenSky proxy (holds client_secret)
  scripts/
    build-airlines.mjs   # generates assets/airlines.json from OpenFlights data
  assets/
    airlines.json        # GENERATED by the script above; ICAO code -> { name, iata }
    logos/               # bundled logo pack keyed by IATA + military.png + na.png
  src/
    api/
      opensky.ts         # fetchAircraft() -> calls the proxy route
      adsbdb.ts          # fetchRoute(callsign) -> origin/dest, cached
    hooks/
      useLocation.ts
      useDeviceOrientation.ts
      useAircraft.ts      # polling + dead reckoning
    lib/
      geo.ts              # lookAngles, haversine, deadReckon, declination
      projection.ts       # projectToScreen, FOV constants
      airlines.ts         # identify(callsign), resolveLogo()
      format.ts           # locale + units aware number / altitude / speed / time
    i18n/
      index.ts            # i18next init, device-locale detection, persistence
      locales/            # en-US, en-GB, fr-FR, pt-PT, pt-BR, es-ES, de-DE, it-IT (.json)
    components/
      PlaneSprite.tsx     # rotated aircraft glyph (ghost vs locked styling)
      AirlineTag.tsx      # logo swatch + callsign + route + altitude chip
      PlaneMarker.tsx     # sprite + tag, positioned at {x,y}
      RadarView.tsx
      AROverlay.tsx
      DebugReadout.tsx
      LanguagePicker.tsx  # Milestone 7: choose language in settings
    detection/            # Milestone 9 only
      usePlaneDetector.ts
      associate.ts
    types.ts
```

---

## Shared types (`src/types.ts`)

```ts
export type IdentKind = 'airline' | 'military' | 'na';

export interface Aircraft {
  icao24: string;
  callsign: string;
  lat: number; lon: number; alt: number; // alt in metres
  velocity: number;     // m/s
  heading: number;      // true track, degrees
  verticalRate: number; // m/s
  lastUpdate: number;   // ms epoch, for dead reckoning
}

export interface Ident { kind: IdentKind; code: string | null; name: string; iata?: string }
export interface Airport { iata: string; icao: string; name: string; city: string }
export interface Route { origin: Airport; destination: Airport }
export interface Geo { lat: number; lon: number; alt?: number }
export interface Orientation { azimuth: number; elevation: number }

// What the AR layer renders:
export interface PlaneView {
  aircraft: Aircraft;
  ident: Ident;
  route: Route | null;              // null = unknown / unscheduled / military
  screen: { x: number; y: number };
  source: 'detected' | 'projected'; // detected = snapped to camera pixels
}
```

---

## Key algorithms (use these — do not reinvent)

### `src/lib/geo.ts`
```ts
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export function lookAngles(obs: Geo, target: Geo) {
  const R = 6371000;
  const f1 = toRad(obs.lat), f2 = toRad(target.lat);
  const dLon = toRad(target.lon - obs.lon);
  const y = Math.sin(dLon) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dLon);
  const azimuth = (toDeg(Math.atan2(y, x)) + 360) % 360;
  const a = Math.sin((f2 - f1) / 2) ** 2 +
            Math.cos(f1) * Math.cos(f2) * Math.sin(dLon / 2) ** 2;
  const ground = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dAlt = (target.alt ?? 0) - (obs.alt ?? 0);
  const elevation = toDeg(Math.atan2(dAlt, ground));
  return { azimuth, elevation, ground };
}

export function deadReckon(a: Aircraft, now = Date.now()): Aircraft {
  const dt = (now - a.lastUpdate) / 1000;
  if (dt <= 0 || !a.velocity) return a;
  const R = 6371000;
  const dist = a.velocity * dt, brng = toRad(a.heading);
  const f1 = toRad(a.lat), l1 = toRad(a.lon);
  const f2 = Math.asin(Math.sin(f1) * Math.cos(dist / R) +
             Math.cos(f1) * Math.sin(dist / R) * Math.cos(brng));
  const l2 = l1 + Math.atan2(Math.sin(brng) * Math.sin(dist / R) * Math.cos(f1),
             Math.cos(dist / R) - Math.sin(f1) * Math.sin(f2));
  return { ...a, lat: toDeg(f2), lon: toDeg(l2), alt: a.alt + a.verticalRate * dt };
}
```

### `src/lib/projection.ts`
```ts
export const H_FOV = 63, V_FOV = 49; // degrees — tune per device

export function projectToScreen(plane: Orientation, device: Orientation, W: number, H: number) {
  let dAz = plane.azimuth - device.azimuth;
  if (dAz > 180) dAz -= 360; else if (dAz < -180) dAz += 360;
  const dEl = plane.elevation - device.elevation;
  if (Math.abs(dAz) > H_FOV / 2 || Math.abs(dEl) > V_FOV / 2) return null;
  return { x: W / 2 + (dAz / (H_FOV / 2)) * (W / 2), y: H / 2 - (dEl / (V_FOV / 2)) * (H / 2) };
}
```

### `src/hooks/useDeviceOrientation.ts`
```ts
import { Magnetometer, Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

const DECLINATION = 0; // TODO: set local magnetic declination (deg) or derive from location

export function useDeviceOrientation() {
  const [o, setO] = useState({ azimuth: 0, elevation: 0 });
  const mag = useRef({ x: 0, y: 0 }), acc = useRef({ x: 0, y: 0, z: 0 });
  const sm = useRef({ az: 0, el: 0 });
  useEffect(() => {
    Magnetometer.setUpdateInterval(50);
    Accelerometer.setUpdateInterval(50);
    const A = 0.15;
    const update = () => {
      const { x: mx, y: my } = mag.current;
      const { x: ax, y: ay, z: az } = acc.current;
      let heading = (Math.atan2(my, mx) * 180 / Math.PI + DECLINATION + 360) % 360;
      const pitch = Math.atan2(-az, Math.sqrt(ax * ax + ay * ay)) * 180 / Math.PI;
      let d = heading - sm.current.az;
      if (d > 180) d -= 360; else if (d < -180) d += 360;
      sm.current.az = (sm.current.az + A * d + 360) % 360;
      sm.current.el = sm.current.el + A * (pitch - sm.current.el);
      setO({ azimuth: sm.current.az, elevation: sm.current.el });
    };
    const m = Magnetometer.addListener(v => { mag.current = v; update(); });
    const a = Accelerometer.addListener(v => { acc.current = v; update(); });
    return () => { m.remove(); a.remove(); };
  }, []);
  return o;
}
```

### OpenSky state vector indices (`/states/all`)
| idx | field        | idx | field            |
|-----|--------------|-----|------------------|
| 0   | icao24       | 9   | velocity (m/s)   |
| 1   | callsign     | 10  | true_track (deg) |
| 5   | longitude    | 11  | vertical_rate    |
| 6   | latitude     | 13  | geo_altitude (m) |
| 7   | baro_alt (m) | 8   | on_ground (bool) |

---

## Aircraft identification & airline tags

Callsign's first 3 letters = ICAO airline designator (`TAP`=TAP Air Portugal, `EZY`=easyJet,
`DLH`=Lufthansa, `LOT`=LOT Polish...). Resolve to name + logo; known military prefix → "Military";
else "N/A".

### `src/lib/airlines.ts`
```ts
import airlines from '../../assets/airlines.json'; // { "TAP": { "name": "TAP Air Portugal", "iata": "TP" }, ... }
import type { Ident } from '../types';

const MILITARY_PREFIXES = new Set(['RCH','RRR','CFC','BAF','IAM','CTM','HKY','GAF']);

export function identify(callsign: string): Ident {
  const cs = (callsign || '').trim().toUpperCase();
  const code = cs.slice(0, 3);
  const a = (airlines as Record<string, { name: string; iata: string }>)[code];
  if (a) return { kind: 'airline', code, name: a.name, iata: a.iata };
  if (MILITARY_PREFIXES.has(code)) return { kind: 'military', code, name: 'Military' };
  return { kind: 'na', code: null, name: 'N/A' };
}
```

- **airlines.json**: GENERATED from the OpenFlights airlines database by
  `scripts/build-airlines.mjs` (see below). Bundle the output; don't fetch at runtime.
- **logos/**: curated local pack keyed by IATA (`TP.png`, `U2.png`...) plus `military.png` /
  `na.png` fallbacks. `resolveLogo(ident)` returns the IATA asset or the fallback. (Gotcha #7.)

### Generating `airlines.json`
`assets/airlines.json` is produced from the OpenFlights airlines database (public data, no key)
by `scripts/build-airlines.mjs`. It is keyed by ICAO designator with `{ name, iata }`, prefers
active carriers when a code is reused by a defunct one, and emits sorted keys for stable diffs.
A generated copy is already committed; regenerate any time with:

    node scripts/build-airlines.mjs

Optionally expose it as an npm script:

    "scripts": { "build:airlines": "node scripts/build-airlines.mjs" }

The current build holds ~5,800 airlines (e.g. TAP -> TAP Portugal / TP, EZY -> easyJet / U2,
DLH -> Lufthansa / LH). `iata` is empty for carriers with no IATA code; those fall back to the
N/A logo. The script is self-contained (Node 22 built-in `fetch`, no dependencies).

---

## Route enrichment (departure → destination)

Origin/destination are NOT in the OpenSky feed. Look them up by callsign from adsbdb and cache —
routes are stable per callsign, and many flights (military/unscheduled) have none.

### `src/api/adsbdb.ts`
```ts
import type { Route } from '../types';

const cache = new Map<string, Route | null>(); // session cache; back with AsyncStorage if desired

export async function fetchRoute(callsign: string): Promise<Route | null> {
  const cs = (callsign || '').trim().toUpperCase();
  if (!cs) return null;
  if (cache.has(cs)) return cache.get(cs)!;
  try {
    const r = await fetch(`https://api.adsbdb.com/v0/callsign/${cs}`);
    if (!r.ok) { cache.set(cs, null); return null; } // 404 = unknown (common for military)
    const fr = (await r.json())?.response?.flightroute;
    const route: Route | null = fr ? {
      origin: { iata: fr.origin.iata_code, icao: fr.origin.icao_code,
                name: fr.origin.name, city: fr.origin.municipality },
      destination: { iata: fr.destination.iata_code, icao: fr.destination.icao_code,
                     name: fr.destination.name, city: fr.destination.municipality },
    } : null;
    cache.set(cs, route);
    return route;
  } catch { cache.set(cs, null); return null; }
}
```

Rules:
- **Lazy + deduped**: only look up callsigns for planes currently on screen (or tapped), never the
  whole feed each poll. The cache means each callsign is fetched at most once per session.
- Tag renders the IATA pair as `LIS → LHR`. When `route === null`, omit the line (military shows
  "Military · no route" as in the mockup); never show a half-empty arrow.

### Tag UI (matches the agreed mockup)
White chip: logo swatch (shield for military, neutral mark for N/A) + three lines —
callsign (13px medium), `origin → destination` (11px), altitude (11px muted). Status indicator:
solid green dot + "locked" when `source==='detected'`; hollow dot + "computed" when `'projected'`.

---

## Visual detection vs projected sprite

Default, always-on path is the **projected sprite**: draw the glyph at the `projectToScreen`
position. Works for every plane at every altitude. **Visual detection (Milestone 9) is optional**
and only helps for aircraft big enough to appear in frame (approach/takeoff/low/close). When the
detector finds an "airplane" box near a plane's predicted position, snap that marker to the pixels
and flag `source: 'detected'`; everything else stays `projected`.

Milestone 9 notes: use `react-native-vision-camera` frame processors + `react-native-fast-tflite`
with a COCO model (`airplane` class) — swap the AR screen's camera to vision-camera then. Associate
detection boxes to the nearest predicted plane within a pixel threshold; throttle to a few FPS;
keep behind a settings toggle (battery-heavy, experimental).

---

## Internationalization (i18n)

The UI is fully localized. Supported locales (regional variants are first-class, not folded into a
base language):

`en-US`, `en-GB`, `fr-FR`, `pt-PT`, `pt-BR`, `es-ES`, `de-DE`, `it-IT`

- **Translations** live in `src/i18n/locales/<tag>.json`, all keyed identically. `en-US` is the
  source of truth (the complete key set); other files mirror its keys. A file may be *partial* —
  any missing key falls back per the chain below. (`en-GB` is intentionally thin: it overrides only
  where British English differs, e.g. "aeroplanes" vs "airplanes".)
- **Fallback chain** (i18next `fallbackLng`): `en-GB → en-US`, `pt-BR ↔ pt-PT`, everything else
  → `en-US`. So a missing British key resolves to US English, a missing Brazilian key to European
  Portuguese, and any other gap to US English.
- **Detection + persistence**: on first launch, pick the best match for the device locale from
  `expo-localization`; the user can override it in Settings (Milestone 7) and the choice is stored
  in AsyncStorage. Generated locale files are already committed — translations should be reviewed by
  a native speaker before any public release.
- **Numbers, dates, units** are NOT translated as strings — they are formatted at runtime with
  `Intl` for the active locale (e.g. `10,650` in en-US vs `10 650` in fr-FR), plus a metric/imperial
  units preference. See `format.ts`. Unit symbols (`m`, `ft`, `km`...) live under `units` in `en-US`
  and are shared by all locales via fallback.

### `src/i18n/index.ts`
```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import enUS from './locales/en-US.json';
import enGB from './locales/en-GB.json';
import frFR from './locales/fr-FR.json';
import ptPT from './locales/pt-PT.json';
import ptBR from './locales/pt-BR.json';
import esES from './locales/es-ES.json';
import deDE from './locales/de-DE.json';
import itIT from './locales/it-IT.json';

const resources = {
  'en-US': { translation: enUS }, 'en-GB': { translation: enGB },
  'fr-FR': { translation: frFR }, 'pt-PT': { translation: ptPT },
  'pt-BR': { translation: ptBR }, 'es-ES': { translation: esES },
  'de-DE': { translation: deDE }, 'it-IT': { translation: itIT },
};
export const SUPPORTED = Object.keys(resources);
const STORAGE_KEY = 'lang';

function pickLocale(stored?: string | null): string {
  if (stored && SUPPORTED.includes(stored)) return stored;
  for (const { languageTag } of Localization.getLocales()) {
    if (SUPPORTED.includes(languageTag)) return languageTag;      // exact, e.g. pt-BR
    const base = languageTag.split('-')[0];
    const region = SUPPORTED.find((s) => s.startsWith(base + '-')); // same language, any region
    if (region) return region;
  }
  return 'en-US';
}

export async function initI18n() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  await i18n.use(initReactI18next).init({
    resources,
    lng: pickLocale(stored),
    supportedLngs: SUPPORTED,
    fallbackLng: { 'en-GB': ['en-US'], 'pt-BR': ['pt-PT'], 'pt-PT': ['pt-BR'], default: ['en-US'] },
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return i18n;
}

export async function setLanguage(tag: string) {
  await AsyncStorage.setItem(STORAGE_KEY, tag);
  await i18n.changeLanguage(tag);
}
export default i18n;
```

Call `initI18n()` once before rendering (in the root layout), and wrap usage with
`useTranslation()` from `react-i18next` so components re-render on language change.

### `src/lib/format.ts`
```ts
import i18n from '../i18n';
export type Units = 'metric' | 'imperial';
const loc = () => i18n.language || 'en-US';

export const formatNumber = (n: number, o?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(loc(), o).format(n);

export function formatAltitude(metres: number, units: Units) {
  return units === 'imperial'
    ? `${formatNumber(Math.round(metres * 3.28084))} ${i18n.t('units.ft')}`
    : `${formatNumber(Math.round(metres))} ${i18n.t('units.m')}`;
}

export function formatSpeed(ms: number, units: Units) {
  return units === 'imperial'
    ? `${formatNumber(Math.round(ms * 1.94384))} ${i18n.t('units.kn')}`   // knots
    : `${formatNumber(Math.round(ms * 3.6))} ${i18n.t('units.kmh')}`;     // km/h
}

export const formatTime = (ms: number) =>
  new Intl.DateTimeFormat(loc(), { hour: '2-digit', minute: '2-digit' }).format(ms);
```

The `AirlineTag` and detail panel render every label through `t('detail.altitude')` etc., and every
number through `format.ts` — never hard-code a string or a `toLocaleString()` without the locale.

---

## Milestones

### Milestone 0 — Skeleton
Scaffold the Expo Router app, add core packages, create the file structure + `types.ts`, request
location + camera permissions. Install and `initI18n()` now so every string added later goes
through `t()` from the start.
**Acceptance:** dev build runs on a device; home shows Radar/AR buttons + permission status, with
all labels coming from i18n (device locale auto-selected).

### Milestone 1 — Sensors + debug readout
`useDeviceOrientation`, `useLocation`, `DebugReadout` (azimuth/elevation/lat/lon + raw values).
**Acceptance:** pointing north reads ~0° azimuth (±10° after declination); tilting up raises
elevation; values smooth. Fix axis signs here.

### Milestone 2 — 2D radar (NO camera, NO AR)
`radar.tsx` + `RadarView`: top-down, user centred, north up, planes by bearing + ground distance;
device-heading indicator. Single OpenSky fetch is fine.
**Acceptance:** planes match Flightradar24 for the same area.

### Milestone 3 — Proxy + polling + dead reckoning
`app/api/states+api.ts` proxy (holds secret, mints token); `useAircraft` polls every 5–10 s and
runs `deadReckon` on a ~250 ms tick.
**Acceptance:** radar markers glide between polls; no secret in the bundle; graceful 429 handling.

### Milestone 4 — Identification + tags
Run `scripts/build-airlines.mjs` to produce `assets/airlines.json` (a generated copy is already
committed). Implement `airlines.ts`, the `logos/` pack, and `AirlineTag`. Render tags on radar markers.
**Acceptance:** TAP/EZY/DLH resolve to correct logo + name; military prefixes show the shield;
unknown shows N/A.

### Milestone 5 — Route enrichment
`adsbdb.ts` `fetchRoute` with cache; lazy lookups for on-screen planes; add the
`origin → destination` line to the tag, with graceful no-route handling.
**Acceptance:** scheduled airliners show e.g. `LIS → LHR`; planes with no route render cleanly
without an empty arrow; each callsign is fetched at most once.

### Milestone 6 — AR overlay (projected sprites)
`ar.tsx`: full-screen `expo-camera` `CameraView` (back camera) with `PlaneMarker`s placed by
`projectToScreen`; per-frame `lookAngles`. All markers `source: 'projected'`.
**Acceptance:** markers track the sky as the phone sweeps; tune `H_FOV`/`V_FOV` to align.

### Milestone 7 — Localization
Complete the locale files under `src/i18n/locales/` (already committed for all eight locales),
`format.ts`, and a `LanguagePicker` in Settings. Route every visible label through `t()` and every
number/altitude/time through `format.ts`. Wire the metric/imperial units toggle.
**Acceptance:** switching language in Settings updates the whole UI live; pt-PT shows "Definições"
while pt-BR shows "Configurações"; numbers format per locale (e.g. `10 650 m` in fr-FR); the device
locale is auto-selected on first launch and the override persists across restarts.

### Milestone 8 — Polish
Tap a marker for full detail (route names, speed, heading, aircraft type); altitude filter;
off-screen direction arrows; Radar/AR toggle.

### Milestone 9 — Visual detection (OPTIONAL, experimental)
Swap AR camera to `react-native-vision-camera`; add `usePlaneDetector` (tflite COCO airplane) +
`associate.ts`. Snap matched markers to detected pixels (`source: 'detected'`, locked styling);
leave the rest projected. Behind a settings toggle.
**Acceptance:** a low/approaching aircraft in frame gets its marker snapped onto it; high traffic
still shows correctly as projected sprites.

---

## Definition of done
A physical device, pointed at the sky, shows live aircraft as sprites in the correct positions on
the camera feed, each tagged with airline logo / military / N/A, callsign, departure → destination
airports (when known), and altitude — with the entire UI localized across the eight supported
locales — updating smoothly via an authenticated proxy, with a working 2D radar fallback. Visual
detection is an optional enhancement layered on top.
