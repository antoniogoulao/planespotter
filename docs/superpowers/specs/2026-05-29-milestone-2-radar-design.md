# Milestone 2 — 2D Radar Design

**Goal:** Build a north-up 2D radar screen showing nearby aircraft as dot + callsign blips, a cone+dashed-line heading indicator, and range rings — using mock aircraft data until M3 brings live ADS-B.

---

## Architecture

Two files change in M2. No new routes or hooks are added.

| File | Change |
|---|---|
| `src/components/RadarView.tsx` | Pure SVG display component — rings, labels, heading indicator, aircraft blips |
| `app/radar.tsx` | Calls `useLocation()` + `useDeviceOrientation()`, renders `<RadarView />` with mock aircraft |

`RadarView` is a pure display component — it accepts all data as props and has no side-effects. `radar.tsx` owns the hooks and passes data down. When M3 arrives it replaces the mock constant with the live `useAircraft()` hook; `RadarView` is unchanged.

---

## Component Interface

```ts
// src/components/RadarView.tsx
interface RadarViewProps {
  location: { lat: number; lon: number } | null;
  azimuth: number | null;   // device compass heading, degrees 0–360
  aircraft: Aircraft[];
  rangeKm?: number;          // default 50
}

export function RadarView(props: RadarViewProps): JSX.Element
```

`Aircraft` is the existing type from `src/types.ts`:
```ts
interface Aircraft {
  icao24: string; callsign: string;
  lat: number; lon: number; alt: number;
  velocity: number; heading: number; verticalRate: number; lastUpdate: number;
}
```

---

## Rendering — SVG Layer Order (bottom to top)

1. **Black disc background** — `<Circle>` with black fill, clipped to radar radius
2. **Range rings** — 3 concentric `<Circle>` elements at 10 / 25 / 50 km, dark green (`#1e3a2a`) stroke
3. **Range labels** — km value at the top of each ring (`10`, `25`, `50`)
4. **Cardinal markers** — `N` / `E` / `S` / `W` text at disc edge
5. **Heading indicator** (only when `azimuth !== null`):
   - Semi-transparent green cone (~40° wide) from centre to disc edge: `rgba(74,222,128,0.15)`
   - Dashed green centre line over the cone: `#4ade80`, `strokeDasharray="6 4"`, opacity 0.7
   - Both rotated by `azimuth` degrees around the disc centre
6. **Aircraft blips** (only when `location !== null`):
   - For each aircraft: compute bearing + distance using `bearingTo` + `haversineDistance` from `src/lib/geo.ts`
   - Skip aircraft where `haversineDistance > rangeKm * 1000`
   - Map (bearing, distance) to SVG (x, y): `x = sin(bearing°) * (dist/rangeM) * R`, `y = -cos(bearing°) * (dist/rangeM) * R` where R = SVG disc radius in pixels
   - Yellow dot (`#facc15`, r=4) at computed position
   - Callsign label (`#facc15`, monospace, 8px) offset +8px to the right of the dot
7. **Own-ship** — blue dot (`#60a5fa`, r=5) at disc centre
8. **"Locating…" label** — shown at centre only when `location === null`, replacing blips

The radar disc is always north-up. The heading indicator rotates; aircraft blips are positioned by absolute bearing from own-ship, not relative to device heading.

---

## Coordinate Mapping

The SVG fills the screen. `R` (disc radius in SVG pixels) is derived at render time:

```ts
const { width, height } = useWindowDimensions();
const R = Math.min(width, height) * 0.45;   // 90% of the shorter screen dimension
```

Given `R` and `rangeM = rangeKm * 1000`:

```
bearing = bearingTo(location, aircraft)   // degrees, 0 = north
distance = haversineDistance(location, aircraft)  // metres
ratio = Math.min(distance / rangeM, 1)    // clamp to disc edge

x = Math.sin(bearing * DEG) * ratio * R
y = -Math.cos(bearing * DEG) * ratio * R
```

SVG origin is at disc centre. Positive y is down in SVG, hence the negation on y.

---

## Mock Aircraft (in `radar.tsx`)

Three hardcoded aircraft used until M3. Their `lat`/`lon` are computed at render time by `offsetMockAircraft(location)` using `offsetPosition` from `geo.ts`, placing them at fixed bearings and distances from own-ship so blips always appear at plausible positions regardless of where the device is.

```ts
// Offsets: [bearing°, distanceKm]
const MOCK_OFFSETS: [number, number][] = [
  [45,  12],   // BAW123 — 12 km NE
  [210, 20],   // TAP456 — 20 km SSW
  [310, 35],   // RYR789 — 35 km NW
];

const MOCK_BASE: Omit<Aircraft, 'lat' | 'lon'>[] = [
  { icao24: 'abc001', callsign: 'BAW123', alt: 10000, velocity: 250, heading: 60,  verticalRate: 0,  lastUpdate: 0 },
  { icao24: 'abc002', callsign: 'TAP456', alt: 8000,  velocity: 220, heading: 200, verticalRate: -3, lastUpdate: 0 },
  { icao24: 'abc003', callsign: 'RYR789', alt: 12000, velocity: 270, heading: 310, verticalRate: 2,  lastUpdate: 0 },
];

function offsetMockAircraft(origin: { lat: number; lon: number }): Aircraft[] {
  return MOCK_BASE.map((base, i) => {
    const [bearing, km] = MOCK_OFFSETS[i];
    const pos = offsetPosition(origin, bearing, km * 1000);
    return { ...base, lat: pos.lat, lon: pos.lon };
  });
}
```

---

## `radar.tsx` Structure

```tsx
export default function RadarScreen() {
  const { coords } = useLocation();
  const orientation = useDeviceOrientation();

  const location = coords ? { lat: coords.lat, lon: coords.lon } : null;
  const azimuth = orientation?.azimuth ?? null;

  // Offset mock aircraft from own-ship so blips are visible
  const aircraft = location ? offsetMockAircraft(location) : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <RadarView location={location} azimuth={azimuth} aircraft={aircraft} />
    </View>
  );
}
```

`offsetMockAircraft` uses `offsetPosition` from `geo.ts` to place the 3 mock blips at fixed bearings and distances from the current location.

---

## Error Handling

| Condition | Behaviour |
|---|---|
| `location === null` | Rings + heading indicator render; blips area shows "Locating…" at centre |
| `azimuth === null` | Heading indicator hidden; rings and blips still show |
| Aircraft beyond range | `haversineDistance > rangeKm * 1000` → skipped, not rendered |
| Empty `aircraft` array | Normal render — empty radar |

---

## Acceptance Criteria

All must pass on a physical device before M3 begins:

- [ ] Radar screen opens from the home screen
- [ ] Black disc with 3 concentric rings and `10` / `25` / `50` km labels
- [ ] `N` / `E` / `S` / `W` cardinal markers at disc edge
- [ ] Blue own-ship dot at centre
- [ ] Heading indicator (cone + dashed line) rotates smoothly as device is rotated
- [ ] 3 mock blips appear with callsigns (`BAW123`, `TAP456`, `RYR789`) at plausible positions
- [ ] Blips disappear when GPS is unavailable (`location === null`), "Locating…" appears instead
- [ ] TypeScript compiles clean
