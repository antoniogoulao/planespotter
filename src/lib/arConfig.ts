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
