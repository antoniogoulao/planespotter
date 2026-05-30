import { bearingTo, haversineDistance } from './geo';
import { Geo } from '../types';

export const DEFAULT_FOV = { h: 62, v: 103 };

export function projectToScreen(
  device: Geo & { alt: number },
  orientation: { azimuth: number; elevation: number },
  aircraft: Geo & { alt: number },
  screen: { width: number; height: number },
  fov?: { h: number; v: number },
): { x: number; y: number } | null {
  const { h: hFov, v: vFov } = fov ?? DEFAULT_FOV;

  const bearing = bearingTo(device, aircraft);
  const dAz     = ((bearing - orientation.azimuth + 540) % 360) - 180;

  const horizDist           = haversineDistance(device, aircraft);
  const altDiff             = (aircraft.alt ?? 0) - device.alt;
  const elevationToAircraft = Math.atan2(altDiff, horizDist) * (180 / Math.PI);
  const dEl                 = elevationToAircraft - orientation.elevation;

  if (Math.abs(dAz) > hFov / 2 || Math.abs(dEl) > vFov / 2) return null;

  return {
    x: screen.width  / 2 + (dAz / (hFov / 2)) * (screen.width  / 2),
    y: screen.height / 2 - (dEl / (vFov / 2)) * (screen.height / 2),
  };
}
