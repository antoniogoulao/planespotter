# Milestone 1 — Sensors + Debug Readout Design

**Goal:** Fill in the sensor hooks (`useLocation`, `useDeviceOrientation`), the geo math library (`geo.ts`), and a toggleable debug overlay (`DebugReadout`) so live sensor values can be verified on a physical device.

---

## Architecture

Five files change in M1. No new routes are added.

| File | Change |
|---|---|
| `src/hooks/useLocation.ts` | GPS subscription → coords + accuracy |
| `src/hooks/useDeviceOrientation.ts` | Magnetometer + accelerometer → tilt-compensated azimuth + elevation |
| `src/lib/geo.ts` | Pure math: haversine distance, bearing, dead-reckoning offset |
| `src/components/DebugReadout.tsx` | Semi-transparent overlay; calls both hooks internally |
| `app/_layout.tsx` | Adds `showDebug` state, floating `[D]` toggle chip, and `<DebugReadout />` — all inside `if (__DEV__)` |

The DebugReadout owns the sensor hooks — they only run while the overlay is visible. Future screens (M2 radar, M6 AR) will call the same hooks independently when they need them.

---

## Component Interfaces

### `useLocation`

```ts
interface LocationState {
  coords: { lat: number; lon: number; alt: number; accuracy: number } | null;
  error: string | null;
}
export function useLocation(): LocationState
```

- Calls `Location.watchPositionAsync` with `Accuracy.Balanced`
- Returns `coords: null` + an error string if permission is missing or watch fails
- Cleans up the subscription on unmount

### `useDeviceOrientation`

```ts
interface OrientationState {
  azimuth: number;   // 0–360°, north = 0, clockwise
  elevation: number; // –90 to +90°, horizon = 0, sky = positive
}
export function useDeviceOrientation(): OrientationState | null
```

- Subscribes to both `Magnetometer` and `Accelerometer` from `expo-sensors`
- Applies tilt-compensated heading math (pitch/roll from accelerometer, corrected magnetometer XY plane)
- Returns `null` until both sensors have fired at least once
- Light low-pass filter on both inputs to reduce noise
- Cleans up both subscriptions on unmount

### `geo.ts`

```ts
export function haversineDistance(a: Geo, b: Geo): number
// Returns ground distance in metres between two lat/lon points

export function bearingTo(from: Geo, to: Geo): number
// Returns true-north bearing in degrees (0–360) from `from` to `to`

export function offsetPosition(from: Geo, bearing: number, metres: number): Geo
// Returns a new Geo displaced from `from` by `metres` along `bearing`
// Used for dead reckoning in M3
```

All three are pure functions. `Geo` is the existing type from `src/types.ts` (`{ lat: number; lon: number; alt?: number }`).

### `DebugReadout`

No props. Self-contained: calls `useLocation` and `useDeviceOrientation` internally.

Renders a semi-transparent panel anchored to the bottom of the screen showing:

| Label | Value |
|---|---|
| Lat / Lon | e.g. `48.8566, 2.3522` |
| Accuracy | e.g. `±12 m` |
| Altitude | e.g. `35 m` |
| Heading | e.g. `247°` |
| Elevation | e.g. `+32°` |

Shows `—` for each field while the value is `null`. Shows the error string from `useLocation` if location fails.

---

## Toggle Mechanism

In `app/_layout.tsx`, wrapped in `if (__DEV__)`:

- `showDebug` boolean state, default `false`
- A 32×32 semi-transparent `[D]` chip fixed to the bottom-left corner
- Tapping it flips `showDebug`
- When `showDebug` is `true`, `<DebugReadout />` renders as an absolute-positioned overlay above all screen content

The toggle and overlay are completely absent from production builds.

---

## Error Handling

- **Location permission missing:** `useLocation` returns `{ coords: null, error: "Location permission not granted" }`. DebugReadout displays the error string.
- **Orientation sensors unavailable:** `useDeviceOrientation` returns `null`. DebugReadout shows `—` for heading and elevation.
- **Sensors not yet fired:** `useDeviceOrientation` returns `null` until both magnetometer and accelerometer emit their first event. Same `—` treatment.
- **Subscription cleanup:** Both hooks clean up all subscriptions in their `useEffect` return to avoid memory leaks.
- No retries or fallbacks — failures are immediately visible in the overlay.

---

## Acceptance Criteria

All must pass on a physical device before M2 begins:

- [ ] `[D]` chip visible in dev build; absent in a production build
- [ ] Tapping `[D]` shows/hides the overlay without crashing
- [ ] Lat/lon updates as device moves
- [ ] Accuracy value is a plausible number (< 100 m indoors)
- [ ] Heading changes smoothly when rotating the device
- [ ] Elevation changes when tilting the device toward/away from the sky
- [ ] No stale subscriptions after toggling the overlay off and on several times
- [ ] TypeScript compiles with no errors (`npx tsc --noEmit`)