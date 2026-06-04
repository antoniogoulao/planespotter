# AR Camera Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shutter button (captures composite photo to Camera Roll) and a zoom pill (cycles 1×/2×/4×) to the AR screen.

**Architecture:** A new `src/lib/arConfig.ts` holds the pure `ZOOM_CONFIG` map and `nextZoom` cycle function so they can be unit-tested without native-module mocks. `app/ar.tsx` imports those, wraps its render tree in a `ViewShot`, and adds zoom + capture state, two inline sub-components (`ShutterButton`, `ZoomPill`), a controls bar overlay, and an animated toast.

**Tech Stack:** react-native-view-shot, expo-media-library, Expo Camera (existing), React Native Animated API

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/arConfig.ts` | `ZOOM_CONFIG`, `ZoomLevel` type, `nextZoom` function |
| Create | `__tests__/arConfig.test.ts` | Unit tests for the above |
| Modify | `app/ar.tsx` | Zoom + capture state, ViewShot wrapper, ShutterButton, ZoomPill, controls bar, toast |
| Modify | `app.json` | Add `expo-media-library` plugin |

---

### Task 1: Install packages

**Files:**
- Modify: `package.json` (auto-updated by expo install)

- [ ] **Step 1: Install react-native-view-shot and expo-media-library**

```bash
npx expo install react-native-view-shot expo-media-library
```

Expected output ends with something like:
```
› Added 2 packages.
```

- [ ] **Step 2: Verify packages appear in package.json**

```bash
grep -E '"react-native-view-shot|expo-media-library' package.json
```

Expected: both lines present.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install react-native-view-shot and expo-media-library"
```

---

### Task 2: Configure app.json

**Files:**
- Modify: `app.json`

- [ ] **Step 1: Add the expo-media-library plugin**

In `app.json`, inside the `"plugins"` array, add after the `"expo-sensors"` entry:

```json
["expo-media-library", {
  "photosPermission": "PlaneSpotter needs photo library access to save AR screenshots.",
  "savePhotosPermission": "PlaneSpotter needs permission to save photos to your Camera Roll.",
  "isAccessMediaLocationEnabled": true
}]
```

The full `plugins` array becomes:
```json
"plugins": [
  "expo-router",
  "expo-image",
  "expo-localization",
  ["expo-camera", { "cameraPermission": "PlaneSpotter needs camera access to show aircraft on the live feed." }],
  ["expo-location", { "locationWhenInUsePermission": "PlaneSpotter uses your location to find nearby aircraft." }],
  "expo-sensors",
  ["expo-media-library", {
    "photosPermission": "PlaneSpotter needs photo library access to save AR screenshots.",
    "savePhotosPermission": "PlaneSpotter needs permission to save photos to your Camera Roll.",
    "isAccessMediaLocationEnabled": true
  }]
]
```

- [ ] **Step 2: Verify valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add app.json
git commit -m "feat(ar): add expo-media-library plugin to app.json"
```

---

### Task 3: Create arConfig.ts with TDD

**Files:**
- Create: `src/lib/arConfig.ts`
- Create: `__tests__/arConfig.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/arConfig.test.ts`:

```typescript
import { ZOOM_CONFIG, nextZoom } from '../src/lib/arConfig';

describe('ZOOM_CONFIG', () => {
  it('has correct cameraZoom values', () => {
    expect(ZOOM_CONFIG['1x'].cameraZoom).toBe(0);
    expect(ZOOM_CONFIG['2x'].cameraZoom).toBe(0.2);
    expect(ZOOM_CONFIG['4x'].cameraZoom).toBe(0.4);
  });

  it('halves the FOV at 2x', () => {
    expect(ZOOM_CONFIG['2x'].fov.h).toBeCloseTo(ZOOM_CONFIG['1x'].fov.h / 2);
    expect(ZOOM_CONFIG['2x'].fov.v).toBeCloseTo(ZOOM_CONFIG['1x'].fov.v / 2);
  });

  it('quarters the FOV at 4x', () => {
    expect(ZOOM_CONFIG['4x'].fov.h).toBeCloseTo(ZOOM_CONFIG['1x'].fov.h / 4);
    expect(ZOOM_CONFIG['4x'].fov.v).toBeCloseTo(ZOOM_CONFIG['1x'].fov.v / 4);
  });
});

describe('nextZoom', () => {
  it('cycles 1x → 2x', () => expect(nextZoom('1x')).toBe('2x'));
  it('cycles 2x → 4x', () => expect(nextZoom('2x')).toBe('4x'));
  it('cycles 4x → 1x', () => expect(nextZoom('4x')).toBe('1x'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/arConfig.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '../src/lib/arConfig'"

- [ ] **Step 3: Create src/lib/arConfig.ts**

```typescript
export const ZOOM_CONFIG = {
  '1x': { cameraZoom: 0,   fov: { h: 62,   v: 103   } },
  '2x': { cameraZoom: 0.2, fov: { h: 31,   v: 51.5  } },
  '4x': { cameraZoom: 0.4, fov: { h: 15.5, v: 25.75 } },
} as const;

export type ZoomLevel = keyof typeof ZOOM_CONFIG;

const ZOOM_CYCLE: ZoomLevel[] = ['1x', '2x', '4x'];

export function nextZoom(current: ZoomLevel): ZoomLevel {
  const idx = ZOOM_CYCLE.indexOf(current);
  return ZOOM_CYCLE[(idx + 1) % ZOOM_CYCLE.length];
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/arConfig.test.ts --no-coverage
```

Expected: PASS — 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/arConfig.ts __tests__/arConfig.test.ts
git commit -m "feat(ar): add ZOOM_CONFIG and nextZoom with tests"
```

---

### Task 4: Wrap render in ViewShot and wire zoom

**Files:**
- Modify: `app/ar.tsx`

- [ ] **Step 1: Replace the contents of app/ar.tsx with the following**

This step adds: imports for ViewShot + arConfig, zoom state, ViewShot wrapper, zoom props on CameraView and AROverlay. Capture logic and controls UI come in the next two tasks.

```typescript
import React, { useRef, useState } from 'react';
import { Animated, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useTranslation } from 'react-i18next';
import ViewShot from 'react-native-view-shot';
import { useLocation } from '../src/hooks/useLocation';
import { useDeviceOrientation } from '../src/hooks/useDeviceOrientation';
import { useAircraft } from '../src/hooks/useAircraft';
import { useRoutes } from '../src/hooks/useRoutes';
import { AROverlay } from '../src/components/AROverlay';
import { ZOOM_CONFIG, ZoomLevel, nextZoom } from '../src/lib/arConfig';

function ShutterButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.shutter, disabled && styles.shutterDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel="Take photo"
    />
  );
}

function ZoomPill({ zoom, onPress }: { zoom: ZoomLevel; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.zoomPill} onPress={onPress} accessibilityLabel={`Zoom ${zoom}`}>
      <Text style={styles.zoomText}>{zoom}</Text>
    </TouchableOpacity>
  );
}

export default function ARScreen() {
  const { t } = useTranslation();
  const { coords } = useLocation();
  const orientation = useDeviceOrientation();
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState<ZoomLevel>('1x');
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShot>(null);

  const location = coords
    ? { lat: coords.lat, lon: coords.lon, alt: 0 }
    : null;

  const aircraft  = useAircraft(location);
  const callsigns = aircraft.map(ac => ac.callsign).filter(Boolean);
  const routes    = useRoutes(callsigns);

  function showToast(message: string, duration: number) {
    setToast(message);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }

  function triggerFlash() {
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
  }

  async function handleCapture() {
    if (capturing || !viewShotRef.current) return;
    triggerFlash();
    setCapturing(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Could not save photo', 2000);
        return;
      }
      const uri = await viewShotRef.current.capture!();
      await MediaLibrary.saveToLibraryAsync(uri);
      showToast('Saved ✓', 1500);
    } catch {
      showToast('Could not save photo', 2000);
    } finally {
      setCapturing(false);
    }
  }

  function handleZoom() {
    setZoom(z => nextZoom(z));
  }

  if (!camPermission) return <View style={styles.fill} />;

  if (!camPermission.granted) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>
          {camPermission.canAskAgain
            ? t('ar.permissionRequired')
            : t('ar.permissionDenied')}
        </Text>
        {camPermission.canAskAgain && (
          <Button title={t('ar.grantPermission')} onPress={requestCamPermission} />
        )}
      </View>
    );
  }

  const { cameraZoom, fov } = ZOOM_CONFIG[zoom];

  return (
    <ViewShot ref={viewShotRef} style={styles.fill} options={{ format: 'jpg', quality: 0.9 }}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" zoom={cameraZoom} />
      <AROverlay
        style={StyleSheet.absoluteFill}
        aircraft={aircraft}
        location={location}
        orientation={orientation}
        routes={routes}
        fov={fov}
      />
      <View style={styles.controls} pointerEvents="box-none">
        <View style={styles.controlsBar}>
          <View style={styles.controlsSpacer} />
          <ShutterButton onPress={handleCapture} disabled={capturing} />
          <View style={styles.controlsRight}>
            <ZoomPill zoom={zoom} onPress={handleZoom} />
          </View>
        </View>
      </View>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flash, { opacity: flashOpacity }]}
        pointerEvents="none"
      />
      {toast !== null && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </ViewShot>
  );
}

const styles = StyleSheet.create({
  fill:      { flex: 1, backgroundColor: '#000' },
  error:     { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  debug:     { position: 'absolute', top: 80, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 6, gap: 2 },
  dbg:       { color: '#4ade80', fontFamily: 'monospace', fontSize: 11 },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingBottom: 48,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  controlsSpacer: { width: 52 },
  controlsRight:  { flex: 1, alignItems: 'flex-end' },
  shutter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  shutterDisabled: { opacity: 0.5 },
  flash: { backgroundColor: '#fff' },
  zoomPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  zoomText:  { color: '#fff', fontSize: 14, fontWeight: '600' },
  toast: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toastText: { color: '#fff', fontSize: 14 },
});
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. If `react-native-view-shot` types complain, check that `viewShotRef.current.capture!()` is accepted; the `!` asserts the method exists at runtime.

- [ ] **Step 3: Run full test suite to confirm no regressions**

```bash
npx jest --no-coverage
```

Expected: all existing tests pass; the new arConfig tests also pass.

- [ ] **Step 4: Commit**

```bash
git add app/ar.tsx
git commit -m "feat(ar): add shutter button and zoom pill with capture and flash"
```

---

## Manual Verification Checklist

After all tasks are committed, verify in Expo Go / simulator:

- [ ] Zoom pill shows "1×" on open; tapping cycles → "2×" → "4×" → "1×"
- [ ] Camera preview visually zooms in at 2× and 4×
- [ ] AR markers remain correctly positioned at each zoom level
- [ ] Shutter button is a white circle in the centre-bottom area
- [ ] Tapping shutter triggers a brief white full-screen flash
- [ ] On first shutter tap, iOS photo-library permission dialog appears
- [ ] After granting permission, photo is saved and "Saved ✓" toast appears and fades
- [ ] If permission is denied, "Could not save photo" toast appears
- [ ] Shutter button is visually dimmed (opacity 0.5) while capture is in progress
- [ ] Double-tapping shutter during capture does not trigger a second save