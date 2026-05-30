import { projectToScreen, DEFAULT_FOV } from '../src/lib/projection';
import { offsetPosition } from '../src/lib/geo';

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
    // Device facing 60°. Aircraft at bearing ≈ 90° (east). dAz = 30 = hFOV/2.
    const aircraft = offsetPosition(DEVICE, 90, 10000);
    aircraft.alt = 50;
    const result = projectToScreen(
      DEVICE,
      { azimuth: 60, elevation: 0 },
      aircraft as { lat: number; lon: number; alt: number },
      SCREEN, FOV,
    );
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(390, 0);
    expect(result!.y).toBeCloseTo(422, 0);
  });

  it('aircraft 1° outside horizontal FOV returns null', () => {
    // Device facing 0°. Aircraft at bearing ≈ 31° (just past hFOV/2 = 30°).
    const aircraft = offsetPosition(DEVICE, 31, 10000);
    aircraft.alt = 50;
    const result = projectToScreen(
      DEVICE,
      { azimuth: 0, elevation: 0 },
      aircraft as { lat: number; lon: number; alt: number },
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
    // Device level (elevation 0). Aircraft 1 km north at elevation ≈29.99° (just under vFOV/2 = 30).
    const horizMetres = 1000;
    const altDiff     = horizMetres * Math.tan(29.99 * Math.PI / 180);
    const aircraft = offsetPosition(DEVICE, 0, horizMetres);
    aircraft.alt = DEVICE.alt + altDiff;
    const result = projectToScreen(
      DEVICE,
      { azimuth: 0, elevation: 0 },
      aircraft as { lat: number; lon: number; alt: number },
      SCREEN, FOV,
    );
    expect(result).not.toBeNull();
    expect(result!.x).toBeCloseTo(195, 0);
    expect(result!.y).toBeCloseTo(0, 0);  // ~0.14 in practice due to floating-point precision
  });
});
