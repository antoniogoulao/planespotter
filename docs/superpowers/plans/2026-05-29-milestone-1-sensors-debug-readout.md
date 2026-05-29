# Milestone 1 — Sensors + Debug Readout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill in `useLocation`, `useDeviceOrientation`, `geo.ts`, and `DebugReadout` so live sensor values can be verified on a physical device via a toggleable overlay.

**Architecture:** `DebugReadout` owns both sensor hooks so they only run while the overlay is visible. A `[D]` chip in the root layout (only in `__DEV__` builds) toggles the overlay. `geo.ts` is pure math with no side-effects — it has unit tests; the hooks are verified on-device.

**Tech Stack:** expo-sensors (Magnetometer, Accelerometer), expo-location, jest-expo (unit tests for geo.ts), TypeScript strict.

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Fill in | `src/lib/geo.ts` | Pure math: haversine distance, bearing, dead-reckoning offset |
| Fill in | `src/hooks/useLocation.ts` | GPS subscription → lat/lon/alt/accuracy |
| Fill in | `src/hooks/useDeviceOrientation.ts` | Magnetometer + accelerometer → tilt-compensated azimuth + elevation |
| Fill in | `src/components/DebugReadout.tsx` | Semi-transparent overlay; calls both hooks |
| Modify | `app/_layout.tsx` | Add `showDebug` state, `[D]` toggle chip, `<DebugReadout />` |
| Create | `__tests__/geo.test.ts` | Unit tests for all three geo.ts functions |

---

### Task 1: Set up Jest and implement `geo.ts`

**Files:**
- Fill in: `src/lib/geo.ts`
- Create: `__tests__/geo.test.ts`
- Modify: `package.json` (add jest preset + test script)

- [ ] **Step 1.1: Install jest-expo**

```bash
npx expo install jest-expo
npm install --save-dev @types/jest
```

Expected: `jest-expo` and `@types/jest` appear in `package.json`.

- [ ] **Step 1.2: Add Jest config to `package.json`**

Open `package.json` and add inside the top-level object:

```json
"scripts": {
  "start": "expo start",
  "android": "expo run:android",
  "ios": "expo run:ios",
  "web": "expo start --web",
  "test": "jest"
},
"jest": {
  "preset": "jest-expo"
}
```

- [ ] **Step 1.3: Write the failing tests**

Create `__tests__/geo.test.ts`:

```ts
import { haversineDistance, bearingTo, offsetPosition } from '../src/lib/geo';

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistance({ lat: 48.8566, lon: 2.3522 }, { lat: 48.8566, lon: 2.3522 })).toBe(0);
  });

  it('returns ~111 195 m for 1 degree of latitude', () => {
    const d = haversineDistance({ lat: 0, lon: 0 }, { lat: 1, lon: 0 });
    expect(d).toBeCloseTo(111_195, -2);
  });

  it('Paris → London is ~341 550 m', () => {
    const d = haversineDistance(
      { lat: 48.8566, lon: 2.3522 },
      { lat: 51.5074, lon: -0.1278 },
    );
    expect(d).toBeCloseTo(341_550, -3);
  });
});

describe('bearingTo', () => {
  it('north is 0°', () => {
    expect(bearingTo({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(0, 0);
  });

  it('east is 90°', () => {
    expect(bearingTo({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(90, 0);
  });

  it('south is 180°', () => {
    expect(bearingTo({ lat: 1, lon: 0 }, { lat: 0, lon: 0 })).toBeCloseTo(180, 0);
  });

  it('west is 270°', () => {
    expect(bearingTo({ lat: 0, lon: 1 }, { lat: 0, lon: 0 })).toBeCloseTo(270, 0);
  });
});

describe('offsetPosition', () => {
  it('moving 0 m returns the same coordinates', () => {
    const result = offsetPosition({ lat: 48.8566, lon: 2.3522 }, 0, 0);
    expect(result.lat).toBeCloseTo(48.8566, 4);
    expect(result.lon).toBeCloseTo(2.3522, 4);
  });

  it('moving 1000 m north increases latitude', () => {
    const result = offsetPosition({ lat: 48.8566, lon: 2.3522 }, 0, 1000);
    expect(result.lat).toBeGreaterThan(48.8566);
    expect(result.lon).toBeCloseTo(2.3522, 3);
  });

  it('round-trip: haversineDistance of offsetPosition result ≈ input metres', () => {
    const from = { lat: 48.8566, lon: 2.3522 };
    const to = offsetPosition(from, 45, 500);
    expect(haversineDistance(from, to)).toBeCloseTo(500, 0);
  });
});
```

- [ ] **Step 1.4: Run tests — confirm they all fail**

```bash
npm test
```

Expected: all 9 tests fail with "not a function" or similar import errors (geo.ts is a stub).

- [ ] **Step 1.5: Implement `src/lib/geo.ts`**

```ts
import { Geo } from '../types';

const R = 6_371_000; // Earth radius, metres
const DEG = Math.PI / 180;

export function haversineDistance(a: Geo, b: Geo): number {
  const dLat = (b.lat - a.lat) * DEG;
  const dLon = (b.lon - a.lon) * DEG;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bearingTo(from: Geo, to: Geo): number {
  const dLon = (to.lon - from.lon) * DEG;
  const y = Math.sin(dLon) * Math.cos(to.lat * DEG);
  const x =
    Math.cos(from.lat * DEG) * Math.sin(to.lat * DEG) -
    Math.sin(from.lat * DEG) * Math.cos(to.lat * DEG) * Math.cos(dLon);
  return ((Math.atan2(y, x) / DEG) + 360) % 360;
}

export function offsetPosition(from: Geo, bearing: number, metres: number): Geo {
  const d = metres / R;
  const b = bearing * DEG;
  const lat1 = from.lat * DEG;
  const lon1 = from.lon * DEG;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: lat2 / DEG, lon: lon2 / DEG };
}
```

- [ ] **Step 1.6: Run tests — confirm they all pass**

```bash
npm test
```

Expected: 9/9 PASS.

- [ ] **Step 1.7: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.8: Commit**

```bash
git add src/lib/geo.ts __tests__/geo.test.ts package.json package-lock.json
git commit -m "feat(M1): implement geo math (haversine, bearing, offsetPosition) with tests"
```

---

### Task 2: Implement `useLocation`

**Files:**
- Fill in: `src/hooks/useLocation.ts`

- [ ] **Step 2.1: Implement `src/hooks/useLocation.ts`**

```ts
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface LocationState {
  coords: { lat: number; lon: number; alt: number; accuracy: number } | null;
  error: string | null;
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ coords: null, error: null });

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ coords: null, error: 'Location permission not granted' });
        return;
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 2000, distanceInterval: 1 },
        (loc) => {
          setState({
            coords: {
              lat: loc.coords.latitude,
              lon: loc.coords.longitude,
              alt: loc.coords.altitude ?? 0,
              accuracy: loc.coords.accuracy ?? 0,
            },
            error: null,
          });
        },
      );
    })();

    return () => { sub?.remove(); };
  }, []);

  return state;
}
```

- [ ] **Step 2.2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.3: Commit**

```bash
git add src/hooks/useLocation.ts
git commit -m "feat(M1): implement useLocation GPS hook"
```

---

### Task 3: Implement `useDeviceOrientation`

**Files:**
- Fill in: `src/hooks/useDeviceOrientation.ts`

The algorithm fuses magnetometer and accelerometer into a tilt-compensated compass heading (azimuth) and a device elevation angle:

- **pitch** = `atan2(-ax, sqrt(ay² + az²))` — forward/back tilt in radians
- **roll** = `atan2(ay, az)` — left/right tilt in radians
- **Bx** = tilt-corrected magnetic east component
- **By** = tilt-corrected magnetic north component
- **azimuth** = `(atan2(-By, Bx) → degrees + 360) % 360`
- **elevation** = `atan2(ax, sqrt(ay² + az²)) → degrees` (0° = horizon, +90° = camera pointing straight up)

A low-pass filter (α = 0.2) smooths both sensor streams before the math.

- [ ] **Step 3.1: Implement `src/hooks/useDeviceOrientation.ts`**

```ts
import { useEffect, useRef, useState } from 'react';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import { Orientation } from '../types';

const ALPHA = 0.2;

interface Vec3 { x: number; y: number; z: number }

function lerp(prev: Vec3, next: Vec3): Vec3 {
  return {
    x: prev.x + ALPHA * (next.x - prev.x),
    y: prev.y + ALPHA * (next.y - prev.y),
    z: prev.z + ALPHA * (next.z - prev.z),
  };
}

export function useDeviceOrientation(): Orientation | null {
  const [state, setState] = useState<Orientation | null>(null);
  const accel = useRef<Vec3 | null>(null);
  const mag = useRef<Vec3 | null>(null);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    Magnetometer.setUpdateInterval(100);

    function compute() {
      const a = accel.current;
      const m = mag.current;
      if (!a || !m) return;

      const pitch = Math.atan2(-a.x, Math.sqrt(a.y ** 2 + a.z ** 2));
      const roll = Math.atan2(a.y, a.z);

      const Bx = m.x * Math.cos(pitch) + m.z * Math.sin(pitch);
      const By =
        m.x * Math.sin(roll) * Math.sin(pitch) +
        m.y * Math.cos(roll) -
        m.z * Math.sin(roll) * Math.cos(pitch);

      const RAD = 180 / Math.PI;
      setState({
        azimuth: ((Math.atan2(-By, Bx) * RAD) + 360) % 360,
        elevation: Math.atan2(a.x, Math.sqrt(a.y ** 2 + a.z ** 2)) * RAD,
      });
    }

    const aSub = Accelerometer.addListener((raw) => {
      accel.current = accel.current ? lerp(accel.current, raw) : raw;
      compute();
    });
    const mSub = Magnetometer.addListener((raw) => {
      mag.current = mag.current ? lerp(mag.current, raw) : raw;
      compute();
    });

    return () => { aSub.remove(); mSub.remove(); };
  }, []);

  return state;
}
```

Note: `Orientation` (`{ azimuth, elevation }`) is reused from `src/types.ts` — no new type needed.

- [ ] **Step 3.2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.3: Commit**

```bash
git add src/hooks/useDeviceOrientation.ts
git commit -m "feat(M1): implement useDeviceOrientation with tilt-compensated compass"
```

---

### Task 4: Implement `DebugReadout`

**Files:**
- Fill in: `src/components/DebugReadout.tsx`

- [ ] **Step 4.1: Implement `src/components/DebugReadout.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocation } from '../hooks/useLocation';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function DebugReadout() {
  const { coords, error } = useLocation();
  const orientation = useDeviceOrientation();

  const elev = orientation ? Math.round(orientation.elevation) : null;

  return (
    <View style={styles.container} pointerEvents="none">
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          <Row label="Lat"  value={coords ? coords.lat.toFixed(5) : '—'} />
          <Row label="Lon"  value={coords ? coords.lon.toFixed(5) : '—'} />
          <Row label="Alt"  value={coords ? `${Math.round(coords.alt)} m` : '—'} />
          <Row label="Acc"  value={coords ? `±${Math.round(coords.accuracy)} m` : '—'} />
        </>
      )}
      <Row
        label="Heading"
        value={orientation ? `${Math.round(orientation.azimuth)}°` : '—'}
      />
      <Row
        label="Elevation"
        value={elev !== null ? `${elev >= 0 ? '+' : ''}${elev}°` : '—'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 48,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#9ca3af', fontSize: 12 },
  value: { color: '#f3f4f6', fontSize: 12 },
  error: { color: '#ef4444', fontSize: 12 },
});
```

- [ ] **Step 4.2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.3: Commit**

```bash
git add src/components/DebugReadout.tsx
git commit -m "feat(M1): implement DebugReadout sensor overlay component"
```

---

### Task 5: Wire debug overlay into root layout

**Files:**
- Modify: `app/_layout.tsx`

The current layout returns `<Stack>` directly. It needs to be wrapped in a `<View>` so the absolutely-positioned overlay and toggle chip can sit above the navigation stack.

- [ ] **Step 5.1: Update `app/_layout.tsx`**

Replace the entire file with:

```tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { initI18n } from '../src/i18n';
import { DebugReadout } from '../src/components/DebugReadout';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  if (!ready) return <View style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ title: t('home.title') }} />
        <Stack.Screen name="radar" options={{ title: t('radar.title') }} />
        <Stack.Screen name="ar" options={{ title: t('ar.title') }} />
      </Stack>
      {__DEV__ && (
        <>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => setShowDebug((v) => !v)}
          >
            <Text style={styles.chipText}>D</Text>
          </TouchableOpacity>
          {showDebug && <DebugReadout />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
```

- [ ] **Step 5.2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5.3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(M1): wire DebugReadout overlay and [D] toggle into root layout"
```

---

### Task 6: Build and verify on device

- [ ] **Step 6.1: Run on device**

```bash
npx expo run:ios --device
```

Expected: app builds and installs successfully.

- [ ] **Step 6.2: Verify acceptance criteria on device**

Walk through each item on the physical device:

- [ ] `[D]` chip is visible in the bottom-left corner
- [ ] Tapping `[D]` shows the debug overlay; tapping again hides it — no crash
- [ ] Lat/lon values are present and plausible for your location
- [ ] Accuracy shows a number below 100 m indoors
- [ ] Heading changes smoothly as you rotate the device
- [ ] Elevation changes as you tilt the device from portrait (≈0°) toward pointing at the sky (positive values)
- [ ] Toggling the overlay off and on several times produces no stale subscriptions or freezes

- [ ] **Step 6.3: Final commit**

```bash
git add .
git commit -m "feat(M1): sensors + debug readout complete — passes on-device acceptance criteria"
```

---

## Self-Review

**Spec coverage:**
- ✅ `useLocation` — GPS coords + accuracy + error
- ✅ `useDeviceOrientation` — tilt-compensated azimuth + elevation, reuses `Orientation` from `types.ts`
- ✅ `geo.ts` — haversineDistance, bearingTo, offsetPosition with unit tests
- ✅ `DebugReadout` — semi-transparent overlay, calls both hooks, `—` placeholders while null
- ✅ Toggle — `[D]` chip fixed to bottom-left, `__DEV__` only, `showDebug` state in root layout
- ✅ `_layout.tsx` wired — `<View>` wrapper added so overlay can be absolutely positioned

**Placeholder scan:** None found.

**Type consistency:**
- `useDeviceOrientation` returns `Orientation | null` using the existing `Orientation` type from `src/types.ts`
- `useLocation` returns `LocationState` (defined in the hook file) with `coords.lat/lon/alt/accuracy`
- `DebugReadout` accesses `coords.lat`, `coords.lon`, `coords.alt`, `coords.accuracy`, `orientation.azimuth`, `orientation.elevation` — all match the interfaces defined in Tasks 2–3
- `geo.ts` functions accept `Geo` from `src/types.ts` — consistent throughout
