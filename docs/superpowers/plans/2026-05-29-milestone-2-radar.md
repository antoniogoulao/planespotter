# Milestone 2 — 2D Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a north-up 2D radar screen with range rings, a cone+dashed-line heading indicator, and mock aircraft blips (dot + callsign label) rendered via SVG.

**Architecture:** `RadarView` is a pure display component accepting `location`, `azimuth`, and `aircraft` as props — no hooks inside. `radar.tsx` calls `useLocation()` and `useDeviceOrientation()`, computes mock aircraft positions via `offsetPosition` from `geo.ts`, and passes everything to `<RadarView />`. `projectToSVG` is exported from `RadarView.tsx` so it can be unit tested independently.

**Tech Stack:** react-native-svg (already installed), expo-sensors + expo-location (via M1 hooks), TypeScript strict, jest-expo.

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Fill in | `src/components/RadarView.tsx` | Pure SVG radar display — rings, labels, heading indicator, blips |
| Modify | `app/radar.tsx` | Hook wiring + mock aircraft + mounts RadarView |
| Create | `__tests__/RadarView.test.ts` | Unit tests for `projectToSVG` coordinate math |

---

### Task 1: Implement `RadarView` with unit tests

**Files:**
- Fill in: `src/components/RadarView.tsx`
- Create: `__tests__/RadarView.test.ts`

---

- [ ] **Step 1.1: Write the failing tests**

Create `__tests__/RadarView.test.ts`:

```ts
import { projectToSVG } from '../src/components/RadarView';

const origin = { lat: 0, lon: 0 };

describe('projectToSVG', () => {
  it('aircraft due north maps to x≈0, y negative', () => {
    const { x, y } = projectToSVG(origin, { lat: 1, lon: 0 }, 200_000, 100);
    expect(x).toBeCloseTo(0, 0);
    expect(y).toBeLessThan(0);
  });

  it('aircraft due east maps to y≈0, x positive', () => {
    const { x, y } = projectToSVG(origin, { lat: 0, lon: 1 }, 200_000, 100);
    expect(y).toBeCloseTo(0, 0);
    expect(x).toBeGreaterThan(0);
  });

  it('aircraft at exactly 50% of range maps to 50% of disc radius', () => {
    // 1 degree lat ≈ 111 195 m; range = 222 390 m → ratio ≈ 0.5
    const R = 100;
    const rangeM = 222_390;
    const { x, y } = projectToSVG(origin, { lat: 1, lon: 0 }, rangeM, R);
    const dist = Math.sqrt(x * x + y * y);
    expect(dist).toBeCloseTo(R * 0.5, 0);
  });

  it('aircraft beyond range is clamped to disc edge', () => {
    // 2 degrees lat ≈ 222 390 m; range = 100 000 m → ratio clamped to 1
    const R = 100;
    const { x, y } = projectToSVG(origin, { lat: 2, lon: 0 }, 100_000, R);
    const dist = Math.sqrt(x * x + y * y);
    expect(dist).toBeCloseTo(R, 0);
  });
});
```

- [ ] **Step 1.2: Run tests — confirm they fail**

```bash
npm test -- --testPathPattern=RadarView
```

Expected: 4 tests FAIL with "projectToSVG is not a function" (file is a stub).

- [ ] **Step 1.3: Implement `src/components/RadarView.tsx`**

```tsx
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, {
  Circle, ClipPath, Defs, G, Line, Path,
  Text as SvgText,
} from 'react-native-svg';
import { Aircraft } from '../types';
import { bearingTo, haversineDistance } from '../lib/geo';

export interface RadarViewProps {
  location: { lat: number; lon: number } | null;
  azimuth: number | null;
  aircraft: Aircraft[];
  rangeKm?: number;
}

const DEG = Math.PI / 180;
const RING_KM = [10, 25, 50];

export function projectToSVG(
  location: { lat: number; lon: number },
  target: { lat: number; lon: number },
  rangeM: number,
  R: number,
): { x: number; y: number } {
  const bearing = bearingTo(location, target);
  const distance = haversineDistance(location, target);
  const ratio = Math.min(distance / rangeM, 1);
  return {
    x: Math.sin(bearing * DEG) * ratio * R,
    y: -Math.cos(bearing * DEG) * ratio * R,
  };
}

function conePathD(azimuth: number, R: number): string {
  const a1 = (azimuth - 20) * DEG;
  const a2 = (azimuth + 20) * DEG;
  const x1 = R * Math.sin(a1);
  const y1 = -R * Math.cos(a1);
  const x2 = R * Math.sin(a2);
  const y2 = -R * Math.cos(a2);
  return `M 0 0 L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;
}

export function RadarView({ location, azimuth, aircraft, rangeKm = 50 }: RadarViewProps) {
  const { width, height } = useWindowDimensions();
  const R = Math.min(width, height) * 0.45;
  const rangeM = rangeKm * 1000;

  const visibleAircraft = location
    ? aircraft.filter(a => haversineDistance(location, a) <= rangeM)
    : [];

  const lineEnd = azimuth !== null
    ? { x: R * Math.sin(azimuth * DEG), y: -R * Math.cos(azimuth * DEG) }
    : null;

  return (
    <View style={styles.container}>
      <Svg
        width={R * 2}
        height={R * 2}
        viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`}
      >
        <Defs>
          <ClipPath id="disc">
            <Circle cx={0} cy={0} r={R} />
          </ClipPath>
        </Defs>

        {/* Background disc */}
        <Circle cx={0} cy={0} r={R} fill="#050f08" />

        {/* Range rings */}
        {RING_KM.map(km => (
          <Circle
            key={km}
            cx={0} cy={0}
            r={(km / rangeKm) * R}
            fill="none"
            stroke="#1e3a2a"
            strokeWidth={1}
          />
        ))}

        {/* Range labels */}
        {RING_KM.map(km => (
          <SvgText
            key={`lbl-${km}`}
            x={4}
            y={-(km / rangeKm) * R + 10}
            fill="#374151"
            fontSize={9}
            fontFamily="monospace"
          >
            {String(km)}
          </SvgText>
        ))}

        {/* Cardinal markers */}
        <SvgText x={0}      y={-(R - 12)} fill="#6b7280" fontSize={10} textAnchor="middle" fontFamily="sans-serif">N</SvgText>
        <SvgText x={0}      y={R - 4}     fill="#6b7280" fontSize={10} textAnchor="middle" fontFamily="sans-serif">S</SvgText>
        <SvgText x={R - 6}  y={4}         fill="#6b7280" fontSize={10} textAnchor="end"    fontFamily="sans-serif">E</SvgText>
        <SvgText x={-(R-6)} y={4}         fill="#6b7280" fontSize={10} textAnchor="start"  fontFamily="sans-serif">W</SvgText>

        {/* Heading indicator — cone */}
        {azimuth !== null && (
          <Path
            d={conePathD(azimuth, R)}
            fill="rgba(74,222,128,0.15)"
            clipPath="url(#disc)"
          />
        )}

        {/* Heading indicator — dashed centre line */}
        {lineEnd && (
          <Line
            x1={0} y1={0}
            x2={lineEnd.x} y2={lineEnd.y}
            stroke="#4ade80"
            strokeWidth={1.5}
            strokeDasharray="6,4"
            opacity={0.7}
          />
        )}

        {/* Aircraft blips */}
        <G clipPath="url(#disc)">
          {location && visibleAircraft.map(ac => {
            const { x, y } = projectToSVG(location, ac, rangeM, R);
            return (
              <G key={ac.icao24}>
                <Circle cx={x} cy={y} r={4} fill="#facc15" />
                <SvgText
                  x={x + 8}
                  y={y + 4}
                  fill="#facc15"
                  fontSize={8}
                  fontFamily="monospace"
                >
                  {ac.callsign.trim()}
                </SvgText>
              </G>
            );
          })}
        </G>

        {/* Own-ship */}
        <Circle cx={0} cy={0} r={5} fill="#60a5fa" />

        {/* Locating… */}
        {!location && (
          <SvgText x={0} y={4} fill="#6b7280" fontSize={11} textAnchor="middle" fontFamily="sans-serif">
            Locating…
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
});
```

- [ ] **Step 1.4: Run tests — confirm they all pass**

```bash
npm test -- --testPathPattern=RadarView
```

Expected: 4/4 PASS.

- [ ] **Step 1.5: Run all tests to check for regressions**

```bash
npm test
```

Expected: 14/14 PASS (10 geo tests + 4 RadarView tests).

- [ ] **Step 1.6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.7: Commit**

```bash
git add src/components/RadarView.tsx __tests__/RadarView.test.ts
git commit -m "feat(M2): implement RadarView SVG component with projectToSVG tests"
```

---

### Task 2: Update `radar.tsx` with hooks and mock aircraft

**Files:**
- Modify: `app/radar.tsx`

Context:
- `useLocation` is at `src/hooks/useLocation.ts` — returns `{ coords: { lat, lon, ... } | null; error: string | null }`
- `useDeviceOrientation` is at `src/hooks/useDeviceOrientation.ts` — returns `Orientation | null` where `Orientation = { azimuth: number; elevation: number }`
- `offsetPosition(from: Geo, bearing: number, metres: number): Geo` is exported from `src/lib/geo.ts`
- `Aircraft` is the existing type from `src/types.ts`

---

- [ ] **Step 2.1: Replace `app/radar.tsx`**

```tsx
import { View, StyleSheet } from 'react-native';
import { useLocation } from '../src/hooks/useLocation';
import { useDeviceOrientation } from '../src/hooks/useDeviceOrientation';
import { RadarView } from '../src/components/RadarView';
import { offsetPosition } from '../src/lib/geo';
import { Aircraft } from '../src/types';

// [bearing°, distanceMetres] offsets from own-ship
const MOCK_OFFSETS: [number, number][] = [
  [45,  12_000],  // BAW123 — 12 km NE
  [210, 20_000],  // TAP456 — 20 km SSW
  [310, 35_000],  // RYR789 — 35 km NW
];

type AircraftBase = Omit<Aircraft, 'lat' | 'lon'>;

const MOCK_BASE: AircraftBase[] = [
  { icao24: 'abc001', callsign: 'BAW123', alt: 10000, velocity: 250, heading: 60,  verticalRate: 0,  lastUpdate: 0 },
  { icao24: 'abc002', callsign: 'TAP456', alt: 8000,  velocity: 220, heading: 200, verticalRate: -3, lastUpdate: 0 },
  { icao24: 'abc003', callsign: 'RYR789', alt: 12000, velocity: 270, heading: 310, verticalRate: 2,  lastUpdate: 0 },
];

function offsetMockAircraft(origin: { lat: number; lon: number }): Aircraft[] {
  return MOCK_BASE.map((base, i) => {
    const [bearing, metres] = MOCK_OFFSETS[i];
    const pos = offsetPosition(origin, bearing, metres);
    return { ...base, lat: pos.lat, lon: pos.lon };
  });
}

export default function RadarScreen() {
  const { coords } = useLocation();
  const orientation = useDeviceOrientation();

  const location = coords ? { lat: coords.lat, lon: coords.lon } : null;
  const azimuth = orientation?.azimuth ?? null;
  const aircraft = location ? offsetMockAircraft(location) : [];

  return (
    <View style={styles.container}>
      <RadarView location={location} azimuth={azimuth} aircraft={aircraft} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
```

- [ ] **Step 2.2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.3: Run all tests**

```bash
npm test
```

Expected: 14/14 PASS — no regressions.

- [ ] **Step 2.4: Commit**

```bash
git add app/radar.tsx
git commit -m "feat(M2): wire RadarScreen with hooks and mock aircraft"
```

---

### Task 3: Build and verify on device

- [ ] **Step 3.1: Run on iOS device**

```bash
npx expo run:ios --device
```

Expected: app builds and installs.

- [ ] **Step 3.2: Verify acceptance criteria**

Navigate to the Radar screen from the home screen and check each item:

- [ ] Black disc with 3 concentric green rings
- [ ] `10` / `25` / `50` km labels on the rings
- [ ] `N` / `E` / `S` / `W` cardinal markers at the disc edge
- [ ] Blue own-ship dot at disc centre
- [ ] Green cone + dashed centre line visible and rotating smoothly as device rotates
- [ ] Three mock blips at plausible positions: `BAW123` (NE), `TAP456` (SSW), `RYR789` (NW)
- [ ] Each blip shows callsign label in yellow monospace
- [ ] "Locating…" appears when GPS is unavailable (test by disabling location permission or flying mode)

- [ ] **Step 3.3: Final commit**

```bash
git add .
git commit -m "feat(M2): 2D radar complete — passes on-device acceptance criteria"
```

---

## Self-Review

**Spec coverage:**
- ✅ Pure display component with `location`, `azimuth`, `aircraft`, `rangeKm` props
- ✅ SVG layers in correct order: disc → rings → labels → cardinals → cone → dashed line → blips → own-ship → Locating…
- ✅ `projectToSVG` exported and unit tested (north, east, 50% range, clamping)
- ✅ Heading indicator: semi-transparent cone (40°) + dashed centre line, rotated by azimuth
- ✅ Aircraft beyond range filtered before rendering
- ✅ `location === null` → "Locating…" shown, blips hidden
- ✅ `azimuth === null` → heading indicator hidden
- ✅ Mock aircraft placed via `offsetMockAircraft` using `offsetPosition` from geo.ts
- ✅ `radar.tsx` calls `useLocation()` + `useDeviceOrientation()`, passes results as props
- ✅ `R = Math.min(width, height) * 0.45` from `useWindowDimensions()`
- ✅ Coordinate mapping: `x = sin(bearing°) * ratio * R`, `y = -cos(bearing°) * ratio * R`

**Placeholder scan:** None found.

**Type consistency:**
- `RadarViewProps.location` is `{ lat: number; lon: number } | null` — matches what `radar.tsx` derives from `coords`
- `RadarViewProps.aircraft` is `Aircraft[]` — matches `offsetMockAircraft` return type
- `projectToSVG` takes `{ lat, lon }` targets — matches `Aircraft` (which has `lat` and `lon`)
- `offsetPosition` returns `Geo` (`{ lat, lon, alt? }`) — spread into `Aircraft` which expects `lat` and `lon` ✓
