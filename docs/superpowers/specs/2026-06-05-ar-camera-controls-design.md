# AR Camera Controls — Design Spec
_Date: 2026-06-05_

## Overview

Add two controls to the AR view: a **shutter button** that saves a composite photo (camera feed + AR tags) to Camera Roll, and a **zoom pill** that cycles the camera through 1×, 2×, and 4× zoom levels.

---

## New Dependencies

| Package | Purpose |
|---------|---------|
| `react-native-view-shot` | Captures the full RN view tree (camera preview + AR overlay) as a JPEG |
| `expo-media-library` | Saves the captured URI to the device Camera Roll; handles permission |

Both are installed via `npx expo install`.

---

## UI Layout

Bottom of the AR screen — a single horizontal bar containing:

```
[ 52 px spacer ]  [ Shutter — 64 px circle, centre ]  [ Zoom pill — right ]
```

The controls bar sits in an overlay with `pointerEvents="box-none"` so all taps on the camera area pass through to nothing; only the two buttons are interactive.

**Shutter button:** white filled circle (64 px), 3 px semi-transparent ring border — matches iOS camera aesthetic. Brief white flash animation on press confirms the shot.

**Zoom pill:** rounded rectangle showing current zoom (`1×` / `2×` / `4×`), semi-transparent dark background, white text. Tap cycles to the next level.

---

## Zoom

Three levels, each mapping to a `CameraView` zoom prop value and a scaled FOV for `AROverlay`:

| Level | `CameraView zoom` | AROverlay FOV (h × v) |
|-------|-------------------|----------------------|
| 1×    | 0                 | 62° × 103°           |
| 2×    | 0.2               | 31° × 51.5°          |
| 4×    | 0.4               | 15.5° × 25.75°       |

The `zoom` prop on `CameraView` is a 0–1 fraction of the device's maximum optical zoom. Values 0 / 0.2 / 0.4 give an approximate 1×/2×/4× feel across modern iPhones; exact optical zoom varies by device but the labels communicate the intent clearly.

The FOV is halved at 2× and quartered at 4× so AR tag positions remain geometrically accurate at every zoom level. `AROverlay` already accepts an optional `fov` prop — no changes needed to that component.

State type: `'1x' | '2x' | '4x'`, toggled in a fixed cycle on each zoom pill tap.

---

## Capture Flow

1. User taps the shutter button.
2. A `ViewShot` ref (wrapping `CameraView` + `AROverlay`) calls `capture()` → returns a local JPEG URI.
3. `MediaLibrary.saveToLibraryAsync(uri)` saves the image to Camera Roll.
4. On success: a small "Saved ✓" toast appears and auto-dismisses after 1.5 s.
5. On failure: "Could not save photo" toast dismisses after 2 s.
6. The shutter button is disabled (`capturing` boolean state) for the duration of the save to prevent double-taps.

Toast is implemented as a plain React Native `Animated.View` (fade in / fade out) — no extra dependency.

---

## Permissions

`expo-media-library` is added as a plugin in `app.json`. Permission is requested **lazily on the first shutter tap** using `MediaLibrary.requestPermissionsAsync()`. If the user denies it, the "Could not save photo" toast is shown and the save is skipped. If already granted, the request call resolves immediately with no dialog.

`NSPhotoLibraryAddUsageDescription` (iOS) is set automatically by the plugin when `app.json` is configured correctly.

---

## Component Structure

```
app/ar.tsx
├── state: zoom: '1x' | '2x' | '4x'          (default '1x')
├── state: capturing: boolean                  (default false)
├── ref:   viewShotRef: ViewShot
│
├── ZOOM_CONFIG = {
│     '1x': { cameraZoom: 0,   fov: { h: 62,   v: 103   } },
│     '2x': { cameraZoom: 0.2, fov: { h: 31,   v: 51.5  } },
│     '4x': { cameraZoom: 0.4, fov: { h: 15.5, v: 25.75 } },
│   }
│
├── handleCapture(): async
│     capturing = true
│     uri = await viewShotRef.capture()
│     await MediaLibrary.saveToLibraryAsync(uri)
│     show toast
│     capturing = false
│
├── handleZoom(): cycles '1x' → '2x' → '4x' → '1x'
│
└── render:
    ViewShot (ref=viewShotRef)
    ├── CameraView (zoom=ZOOM_CONFIG[zoom].cameraZoom)
    ├── AROverlay  (fov=ZOOM_CONFIG[zoom].fov)
    └── ARControls overlay (pointerEvents="box-none")
        └── bottom bar
            ├── spacer
            ├── ShutterButton  (onPress=handleCapture, disabled=capturing)
            └── ZoomPill       (label=zoom, onPress=handleZoom)
```

`ShutterButton` and `ZoomPill` are small inline components within `ar.tsx` — they are simple enough not to warrant separate files.

---

## Out of Scope

- Video recording
- Timer / burst mode
- Flash control
- Adjustable FOV calibration
- Sharing sheet (Camera Roll only)