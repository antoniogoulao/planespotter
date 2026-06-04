import { bearingTo, haversineDistance } from './geo';
import { Geo } from '../types';

export const DEFAULT_FOV = { h: 62, v: 103 };

const DEG = Math.PI / 180;

export function projectToScreen(
  device: Geo & { alt: number },
  orientation: { azimuth: number; elevation: number },
  aircraft: Geo & { alt: number },
  screen: { width: number; height: number },
  fov?: { h: number; v: number },
): { x: number; y: number } | null {
  const { h: hFov, v: vFov } = fov ?? DEFAULT_FOV;

  // Aircraft direction as a unit vector in East-North-Up world frame
  const bearing   = bearingTo(device, aircraft);
  const horizDist = haversineDistance(device, aircraft);
  const altDiff   = (aircraft.alt ?? 0) - device.alt;
  const elAcRad   = Math.atan2(altDiff, horizDist);
  const brgRad    = bearing * DEG;

  const dE = Math.sin(brgRad) * Math.cos(elAcRad);
  const dN = Math.cos(brgRad) * Math.cos(elAcRad);
  const dU = Math.sin(elAcRad);

  // Camera basis in ENU
  const azRad = orientation.azimuth  * DEG;
  const elRad = orientation.elevation * DEG;

  // Forward: the direction the camera points
  const fE = Math.sin(azRad) * Math.cos(elRad);
  const fN = Math.cos(azRad) * Math.cos(elRad);
  const fU = Math.sin(elRad);

  // Right: horizontal, 90° clockwise from forward (rU = 0)
  const rE =  Math.cos(azRad);
  const rN = -Math.sin(azRad);

  // Up: right × forward  (gives the screen-up axis, tilts with camera elevation)
  const uE = rN * fU;
  const uN = -rE * fU;
  const uU = rE * fN - rN * fE;

  // Project aircraft direction onto camera axes
  const fwd   = dE * fE + dN * fN + dU * fU;
  const right = dE * rE + dN * rN;               // rU = 0
  const up    = dE * uE + dN * uN + dU * uU;

  if (fwd <= 0) return null;   // aircraft is behind the camera

  // Perspective divide — maps to tangent of off-axis angle
  const px = right / fwd;
  const py = up    / fwd;

  const hTan = Math.tan((hFov * DEG) / 2);
  const vTan = Math.tan((vFov * DEG) / 2);

  if (Math.abs(px) > hTan || Math.abs(py) > vTan) return null;

  return {
    x: screen.width  / 2 + (px / hTan) * (screen.width  / 2),
    y: screen.height / 2 - (py / vTan) * (screen.height / 2),
  };
}