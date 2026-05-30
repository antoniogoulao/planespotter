# Milestone 6 — AR Overlay Design

**Goal:** Replace the AR placeholder with a live camera feed that overlays labelled markers (dot + stem + info card) for each aircraft visible within the camera's field of view, positioned by device compass heading and tilt.

---

## Architecture

Five files are filled in or replaced in M6.

| File | Change |
|---|---|
| `src/lib/projection.ts` | FILL IN — pure `projectToScreen` function |
| `src/components/PlaneSprite.tsx` | FILL IN — yellow dot View |
| `src/components/PlaneMarker.tsx` | FILL IN — absolutely-positioned dot + stem + info card |
| `src/components/AROverlay.tsx` | FILL IN — projects aircraft, renders PlaneMarkers |
| `app/ar.tsx` | REPLACE — `CameraView` + `AROverlay` layered on top |

`ar.tsx` calls the same four hooks as `radar.tsx` (`useLocation`, `useDeviceOrientation`, `useAircraft`, `useRoutes`) and passes data to `AROverlay`. `projection.ts` is pure math — independently unit-testable without any React or native dependencies.

### Layout

```
<View style={{ flex: 1 }}>
  <CameraView style={StyleSheet.absoluteFill} facing="back" />
  <AROverlay style={StyleSheet.absoluteFill} pointerEvents="none" ... />
</View>
```

---

## `projection.ts`

### Signature

```ts
export const DEFAULT_FOV = { h: 60, v: 75 }; // degrees, typical iPhone rear camera portrait

export function projectToScreen(
  device: { lat: number; lon: number; alt: number },
  orientation: { azimuth: number; elevation: number },
  aircraft: { lat: number; lon: number; alt: number },
  screen: { width: number; height: number },
  fov?: { h: number; v: number },
): { x: number; y: number } | null
```

### Algorithm

1. **Bearing to aircraft** — `bearingTo(device, aircraft)` from `src/lib/geo.ts`
2. **Horizontal angular offset** — `dAz = ((bearing − orientation.azimuth + 540) % 360) − 180`. This normalises to (−180, +180]. Positive = right of screen centre.
3. **Elevation to aircraft** — `atan2(aircraft.alt − device.alt, haversineDistance(device, aircraft))` in degrees
4. **Vertical angular offset** — `dEl = elevationToAircraft − orientation.elevation`. Positive = above screen centre.
5. **Off-screen check** — if `|dAz| > fov.h / 2` OR `|dEl| > fov.v / 2` → return `null`
6. **Screen coordinates**:
   ```
   x = screen.width  / 2 + (dAz / (fov.h / 2)) * (screen.width  / 2)
   y = screen.height / 2 − (dEl / (fov.v / 2)) * (screen.height / 2)
   ```
   (y is inverted: positive dEl = above centre = smaller y value)

Uses `fov ?? DEFAULT_FOV`.

---

## Components

### `PlaneSprite`

No props. Renders a 10 × 10 yellow circle:

```tsx
<View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#facc15' }} />
```

### `PlaneMarker`

```ts
interface PlaneMarkerProps {
  aircraft: Aircraft;
  route: Route | null;
  x: number;
  y: number;
}
```

Renders an absolutely-positioned `<View>` at `left: x, top: y` with `transform: [{ translateX: -50 }, { translateY: -98 }]` so the dot centre lands at the projected coordinate. (Card ≈ 60 px tall, stem 28 px, dot 10 px, half-width 50 px.)

Layers (top to bottom in JSX = bottom to top visually):
1. `<PlaneSprite />` — yellow dot
2. Stem — `<View style={{ width: 1, height: 28, backgroundColor: 'rgba(250,204,21,0.5)', alignSelf: 'center' }} />`
3. Info card — `<View style={{ backgroundColor: 'rgba(0,0,0,0.7)', borderWidth: 1, borderColor: '#facc15', borderRadius: 6, padding: 6 }}>`
   - Callsign: yellow, 12px bold monospace
   - FL: grey `#9ca3af`, 10px monospace
   - Route (when non-null and both IATA codes present): grey `#9ca3af`, 10px monospace, `ORIG→DEST`

### `AROverlay`

```ts
interface AROverlayProps {
  aircraft: Aircraft[];
  location: { lat: number; lon: number; alt: number } | null;
  orientation: Orientation | null;
  routes: Map<string, Route | null>;
  fov?: { h: number; v: number };
  style?: ViewStyle;
}
```

- Calls `useWindowDimensions()` to get screen width/height
- Returns `null` (renders nothing) when `location` or `orientation` is null
- For each aircraft: calls `projectToScreen(location, orientation, aircraft, screen, fov)` — renders `<PlaneMarker>` if non-null

### `app/ar.tsx`

```tsx
export default function ARScreen() {
  const { coords, error: locError } = useLocation();
  const orientation = useDeviceOrientation();
  const [camPermission, requestCamPermission] = useCameraPermissions();

  const location = coords
    ? { lat: coords.lat, lon: coords.lon, alt: coords.alt }
    : null;

  const aircraft = useAircraft(location);
  const callsigns = aircraft.map(ac => ac.callsign).filter(Boolean);
  const routes = useRoutes(callsigns);

  // Camera permission not yet determined
  if (!camPermission) return <View style={styles.fill} />;

  // Permission denied
  if (!camPermission.granted) {
    return (
      <View style={styles.fill}>
        <Text style={styles.error}>
          {camPermission.canAskAgain
            ? 'Camera permission required'
            : 'Enable camera access in Settings'}
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
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Camera permission denied | Permission prompt shown; if permanently denied, message with Settings link |
| `location` null (no GPS fix) | AROverlay renders nothing; markers appear once GPS is available |
| `orientation` null (sensors not ready) | AROverlay renders nothing |
| Aircraft outside FOV | `projectToScreen` returns `null` → not rendered |
| `device.alt` unavailable | Falls back to 0; small angular error for high-altitude aircraft, acceptable |

---

## `projection.ts` Unit Tests

| Test | Expected |
|---|---|
| Aircraft dead ahead, at device elevation | `x ≈ width/2`, `y ≈ height/2` |
| Aircraft 30° right of azimuth, same elevation, hFOV=60 | `x = width` (right edge), `y ≈ height/2` |
| Aircraft above device elevation by vFOV/2 | `x ≈ width/2`, `y = 0` (top edge) |
| Aircraft 1° outside horizontal FOV | returns `null` |
| Aircraft 1° outside vertical FOV | returns `null` |

---

## Acceptance Criteria

- [ ] Tapping AR from the home screen opens the camera feed fullscreen in portrait
- [ ] Aircraft visible within ~30° of the phone direction show labelled markers
- [ ] Markers show callsign, FL, and route (when available)
- [ ] Rotating the phone causes markers to move/appear/disappear correctly
- [ ] Aircraft behind or far to the side are not rendered
- [ ] `npx tsc --noEmit` passes; all existing tests pass
