# Milestone 6 — AR Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the AR placeholder with a live fullscreen camera feed that overlays labelled aircraft markers at their projected sky positions, driven by device compass heading and tilt.

**Architecture:** `projection.ts` is a pure function (testable) that maps an aircraft's bearing/elevation to screen `{x, y}` pixels given device orientation and camera FOV. `AROverlay` calls it per-aircraft and renders `PlaneMarker` Views absolutely positioned on top of a `CameraView`. `ar.tsx` wires the same four hooks used by `radar.tsx`.

**Tech Stack:** expo-camera (CameraView, useCameraPermissions), expo-sensors (via existing useDeviceOrientation), React Native absolute layout, jest-expo.

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Fill in | `src/lib/projection.ts` | Pure `projectToScreen` function |
| Fill in | `src/components/PlaneSprite.tsx` | Yellow dot atom |
| Fill in | `src/components/PlaneMarker.tsx` | Dot + stem + info card, absolutely positioned |
| Fill in | `src/components/AROverlay.tsx` | Projects aircraft, renders PlaneMarkers |
| Replace | `app/ar.tsx` | CameraView + AROverlay screen |
| Create | `__tests__/projection.test.ts` | Unit tests for projectToScreen |

---

## Context for all tasks

Already-implemented helpers (`src/lib/geo.ts`):
```ts
export function bearingTo(from: Geo, to: Geo): number        // degrees, 0=north
export function haversineDistance(a: Geo, b: Geo): number    // metres
```

Relevant types (`src/types.ts`):
```ts
interface Aircraft  { icao24, callsign, lat, lon, alt, velocity, heading, verticalRate, lastUpdate }
interface Orientation { azimuth: number; elevation: number }  // azimuth 0-360, elevation -90 to +90
interface Route     { origin: Airport; destination: Airport }
interface Airport   { iata, icao, name, city }
interface Geo       { lat: number; lon: number; alt?: number }
```

Already-implemented hooks:
- `useLocation()` → `{ coords: { lat, lon, alt, accuracy } | null; error: string | null }`
- `useDeviceOrientation()` → `Orientation | null`
- `useAircraft(location)` → `Aircraft[]`
- `useRoutes(callsigns)` → `Map<string, Route | null>`

---

### Task 1: `projection.ts` with unit tests

**Files:**
- Fill in: `src/lib/projection.ts` (currently stub: `// Milestone 6\nexport {};`)
- Create: `__tests__/projection.test.ts`

---

- [ ] **Step 1.1: Write failing tests**

Create `__tests__/projection.test.ts`:

```ts
import { projectToScreen, DEFAULT_FOV } from '../src/lib/projection';

const DEVICE = { lat: 51.5, lon: -0.1, alt: 50 };
const SCREEN = { width: 390, height: 844 };
const FOV    = { h: 60, v: 60 };  // symmetrical for easy arithmetic

describe('projectToScreen', () => {
  it('aircraft dead ahead at same elevation maps to screen centre', () => {
    // 1 km north, same altitude → bearing ≈ 0 = azimuth, elevation ≈ 0 = device elevation
    const result = projectToScreen(
      DEVICE,
      { azimuth: 0, elevation: 0 },
      { lat: 51.509, lon: -0.1, alt: 50 },
      SCREEN, FOV,
    );
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(195, 0);  // 390 / 2
    expect(result!.y).toBeCloseTo(422, 0);  // 844 / 2
  });

  it('aircraft at hFOV/2 right maps to right screen edge', () => {
    // Device facing 60°. Aircraft due east (bearing ≈ 90°). dAz = 30 = hFOV/2.
    const result = projectToScreen(
      DEVICE,
      { azimuth: 60, elevation: 0 },
      { lat: 51.5, lon: 0.4, alt: 50 },   // roughly due east
      SCREEN, FOV,
    );
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(390, 0);
    expect(result!.y).toBeCloseTo(422, 0);
  });

  it('aircraft 1° outside horizontal FOV returns null', () => {
    // Device facing 0°. Aircraft at bearing ≈ 31° (just past hFOV/2 = 30°).
    const result = projectToScreen(
      DEVICE,
      { azimuth: 0, elevation: 0 },
      {
        lat: 51.5 + Math.cos(31 * Math.PI / 180) * 0.09,
        lon: -0.1 + Math.sin(31 * Math.PI / 180) * 0.09,
        alt: 50,
      },
      SCREEN, FOV,
    );
    expect(result).toBeNull();
  });

  it('aircraft 1° below vertical FOV returns null', () => {
    // Device pointing 40° up. Aircraft at horizon (elevation ≈ 0°). dEl = -40, |dEl| = 40 > 30.
    const result = projectToScreen(
      DEVICE,
      { azimuth: 0, elevation: 40 },
      { lat: 51.51, lon: -0.1, alt: 50 },
      SCREEN, FOV,
    );
    expect(result).toBeNull();
  });

  it('aircraft at top of vertical FOV maps to top edge', () => {
    // Device level (elevation 0). Aircraft 1 km north at elevation 30° = vFOV/2.
    const horizMetres = 1000;
    const altDiff     = horizMetres * Math.tan(30 * Math.PI / 180);  // ≈ 577 m
    const result = projectToScreen(
      DEVICE,
      { azimuth: 0, elevation: 0 },
      { lat: 51.5 + horizMetres / 111_000, lon: -0.1, alt: 50 + altDiff },
      SCREEN, FOV,
    );
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(195, 0);
    expect(result!.y).toBeCloseTo(0, 0);
  });
});
```

- [ ] **Step 1.2: Run tests — confirm all fail**

```bash
npm test -- --testPathPattern=projection
```

Expected: 5 FAIL (`projectToScreen` not exported).

- [ ] **Step 1.3: Implement `src/lib/projection.ts`**

```ts
import { bearingTo, haversineDistance } from './geo';

export const DEFAULT_FOV = { h: 60, v: 75 };

export function projectToScreen(
  device: { lat: number; lon: number; alt: number },
  orientation: { azimuth: number; elevation: number },
  aircraft: { lat: number; lon: number; alt: number },
  screen: { width: number; height: number },
  fov?: { h: number; v: number },
): { x: number; y: number } | null {
  const { h: hFov, v: vFov } = fov ?? DEFAULT_FOV;

  const bearing = bearingTo(device, aircraft);
  const dAz     = ((bearing - orientation.azimuth + 540) % 360) - 180;

  const horizDist           = haversineDistance(device, aircraft);
  const altDiff             = aircraft.alt - device.alt;
  const elevationToAircraft = Math.atan2(altDiff, horizDist) * (180 / Math.PI);
  const dEl                 = elevationToAircraft - orientation.elevation;

  if (Math.abs(dAz) > hFov / 2 || Math.abs(dEl) > vFov / 2) return null;

  return {
    x: screen.width  / 2 + (dAz / (hFov / 2)) * (screen.width  / 2),
    y: screen.height / 2 - (dEl / (vFov / 2)) * (screen.height / 2),
  };
}
```

- [ ] **Step 1.4: Run tests — confirm all pass**

```bash
npm test -- --testPathPattern=projection
```

Expected: 5/5 PASS.

- [ ] **Step 1.5: Run all tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 1.6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.7: Commit**

```bash
git add src/lib/projection.ts __tests__/projection.test.ts
git commit -m "feat(M6): implement projectToScreen with unit tests"
```

---

### Task 2: `PlaneSprite` + `PlaneMarker`

**Files:**
- Fill in: `src/components/PlaneSprite.tsx` (currently stub: `// Milestone 6\nexport {};`)
- Fill in: `src/components/PlaneMarker.tsx` (currently stub: `// Milestone 6\nexport {};`)

No automated tests — visual components verified on device.

---

- [ ] **Step 2.1: Implement `src/components/PlaneSprite.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';

export function PlaneSprite() {
  return (
    <View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#facc15',
      }}
    />
  );
}
```

- [ ] **Step 2.2: Implement `src/components/PlaneMarker.tsx`**

The marker renders card → stem → dot (top to bottom). The transform shifts the container so the dot centre lands at `(x, y)` on screen: `translateY: -93` offsets the container top by 93 px (= card 60 px + stem 28 px + dot radius 5 px), `translateX: -50` centres the 100 px-wide container.

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Aircraft, Route } from '../types';
import { PlaneSprite } from './PlaneSprite';

export interface PlaneMarkerProps {
  aircraft: Aircraft;
  route: Route | null;
  x: number;
  y: number;
}

function toFL(altMetres: number): string {
  const fl = Math.round((Math.max(0, altMetres) * 3.28084) / 100);
  return `FL${String(fl).padStart(3, '0')}`;
}

export function PlaneMarker({ aircraft, route, x, y }: PlaneMarkerProps) {
  return (
    <View style={[styles.container, { left: x, top: y }]}>
      <View style={styles.card}>
        <Text style={styles.callsign}>{aircraft.callsign.trim()}</Text>
        <Text style={styles.secondary}>{toFL(aircraft.alt)}</Text>
        {route?.origin.iata && route?.destination.iata && (
          <Text style={styles.secondary}>
            {route.origin.iata}→{route.destination.iata}
          </Text>
        )}
      </View>
      <View style={styles.stem} />
      <PlaneSprite />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -50 }, { translateY: -93 }],
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: '#facc15',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 80,
    alignItems: 'flex-start',
  },
  callsign: {
    color: '#facc15',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  secondary: {
    color: '#9ca3af',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  stem: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(250,204,21,0.5)',
  },
});
```

- [ ] **Step 2.3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.4: Run all tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 2.5: Commit**

```bash
git add src/components/PlaneSprite.tsx src/components/PlaneMarker.tsx
git commit -m "feat(M6): implement PlaneSprite and PlaneMarker components"
```

---

### Task 3: `AROverlay`

**Files:**
- Fill in: `src/components/AROverlay.tsx` (currently stub: `// Milestone 6\nexport {};`)

---

- [ ] **Step 3.1: Implement `src/components/AROverlay.tsx`**

```tsx
import React from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { Aircraft, Orientation, Route } from '../types';
import { projectToScreen, DEFAULT_FOV } from '../lib/projection';
import { PlaneMarker } from './PlaneMarker';

export interface AROverlayProps {
  aircraft: Aircraft[];
  location: { lat: number; lon: number; alt: number } | null;
  orientation: Orientation | null;
  routes: Map<string, Route | null>;
  fov?: { h: number; v: number };
  style?: ViewStyle;
}

export function AROverlay({
  aircraft, location, orientation, routes, fov, style,
}: AROverlayProps) {
  const { width, height } = useWindowDimensions();

  if (!location || !orientation) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {aircraft.map(ac => {
        const pos = projectToScreen(
          location,
          orientation,
          ac,
          { width, height },
          fov ?? DEFAULT_FOV,
        );
        if (!pos) return null;
        return (
          <PlaneMarker
            key={ac.icao24}
            aircraft={ac}
            route={routes.get(ac.callsign) ?? null}
            x={pos.x}
            y={pos.y}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

- [ ] **Step 3.2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.3: Run all tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 3.4: Commit**

```bash
git add src/components/AROverlay.tsx
git commit -m "feat(M6): implement AROverlay — projects aircraft and renders PlaneMarkers"
```

---

### Task 4: Replace `app/ar.tsx`

**Files:**
- Replace: `app/ar.tsx`

---

- [ ] **Step 4.1: Replace `app/ar.tsx`**

```tsx
import { Button, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocation } from '../src/hooks/useLocation';
import { useDeviceOrientation } from '../src/hooks/useDeviceOrientation';
import { useAircraft } from '../src/hooks/useAircraft';
import { useRoutes } from '../src/hooks/useRoutes';
import { AROverlay } from '../src/components/AROverlay';

export default function ARScreen() {
  const { coords } = useLocation();
  const orientation = useDeviceOrientation();
  const [camPermission, requestCamPermission] = useCameraPermissions();

  const location = coords
    ? { lat: coords.lat, lon: coords.lon, alt: coords.alt }
    : null;

  const aircraft  = useAircraft(location);
  const callsigns = aircraft.map(ac => ac.callsign).filter(Boolean);
  const routes    = useRoutes(callsigns);

  if (!camPermission) return <View style={styles.fill} />;

  if (!camPermission.granted) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>
          {camPermission.canAskAgain
            ? 'Camera permission required for AR view.'
            : 'Enable camera access in Settings to use AR view.'}
        </Text>
        {camPermission.canAskAgain && (
          <Button title="Grant Permission" onPress={requestCamPermission} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />
      <AROverlay
        style={StyleSheet.absoluteFill}
        aircraft={aircraft}
        location={location}
        orientation={orientation}
        routes={routes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill:      { flex: 1, backgroundColor: '#000' },
  error:     { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 16 },
});
```

- [ ] **Step 4.2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.3: Run all tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 4.4: Commit**

```bash
git add app/ar.tsx
git commit -m "feat(M6): replace AR placeholder with CameraView + AROverlay screen"
```

---

### Task 5: Verify on device

- [ ] **Step 5.1: Run on device**

```bash
npx expo run:ios --device
```

(Ensure `node server/proxy.mjs` is running for live aircraft data.)

- [ ] **Step 5.2: Verify acceptance criteria**

- [ ] Camera feed fills the screen in portrait
- [ ] Aircraft within ~30° of the phone's pointing direction show a labelled marker (dot + stem + card)
- [ ] Marker shows callsign (yellow), FL (grey), route when available (grey)
- [ ] Rotating the phone causes markers to appear/disappear and move correctly
- [ ] Aircraft far to the side or behind the phone are not rendered
- [ ] Camera permission denied shows a readable error message
- [ ] `npx tsc --noEmit` passes; all existing tests pass

---

## Self-Review

**Spec coverage:**
- ✅ `projectToScreen`: bearing, dAz normalisation formula, elevation to aircraft, dEl, off-screen check, screen coordinates
- ✅ `DEFAULT_FOV = { h: 60, v: 75 }` exported
- ✅ 5 unit tests: centre, right edge, outside horizontal, outside vertical, top edge
- ✅ `PlaneSprite`: 10×10 yellow circle
- ✅ `PlaneMarker`: card → stem → dot, `position: 'absolute'`, transform `translateX:-50 translateY:-93`
- ✅ `PlaneMarker` shows callsign, FL (via `toFL`), route (guarded by IATA check)
- ✅ `AROverlay`: returns null when location/orientation missing; `pointerEvents="none"`; uses `useWindowDimensions`
- ✅ `ar.tsx`: permission handling (pending / denied / granted), `CameraView` + `AROverlay`, same four hooks as radar.tsx

**Placeholder scan:** None found.

**Type consistency:**
- `projectToScreen` `device` param has `{ lat, lon, alt }` — matches `{ lat: coords.lat, lon: coords.lon, alt: coords.alt }` in ar.tsx ✓
- `AROverlay` `location` param type `{ lat, lon, alt } | null` — matches ✓
- `AROverlay` `orientation: Orientation | null` — matches `useDeviceOrientation()` return type ✓
- `PlaneMarker` `route: Route | null` — `AROverlay` passes `routes.get(ac.callsign) ?? null` which is `Route | null` ✓
- `toFL` is defined inline in `PlaneMarker` — not imported from `AirlineTag` (which keeps it private) ✓
