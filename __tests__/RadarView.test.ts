import { projectToSVG, ringDistances } from '../src/components/RadarView';

const origin = { lat: 0, lon: 0 };

describe('projectToSVG', () => {
  it('aircraft due north maps to x≈0, y negative', () => {
    const { x, y } = projectToSVG(origin, { lat: 1, lon: 0 }, 200_000, 100);
    expect(x).toBeCloseTo(0, 0);
    expect(y).toBeLessThan(0);
  });

  it('aircraft due east maps to y≈0, x positive', () => {
    const { x, y } = projectToSVG(origin, { lat: 0, lon: 1 }, 200_000, 100);
    expect(y).toBeCloseTo(0, 0);
    expect(x).toBeGreaterThan(0);
  });

  it('aircraft at exactly 50% of range maps to 50% of disc radius', () => {
    // 1 degree lat ≈ 111 195 m; range = 222 390 m → ratio ≈ 0.5
    const R = 100;
    const rangeM = 222_390;
    const { x, y } = projectToSVG(origin, { lat: 1, lon: 0 }, rangeM, R);
    const dist = Math.sqrt(x * x + y * y);
    expect(dist).toBeCloseTo(R * 0.5, 0);
  });

  it('aircraft beyond range is clamped to disc edge', () => {
    // 2 degrees lat ≈ 222 390 m; range = 100 000 m → ratio clamped to 1
    const R = 100;
    const { x, y } = projectToSVG(origin, { lat: 2, lon: 0 }, 100_000, R);
    const dist = Math.sqrt(x * x + y * y);
    expect(dist).toBeCloseTo(R, 0);
  });
});

describe('ringDistances', () => {
  it('keeps rings at fixed distances so they expand outwards when zooming in', () => {
    expect(ringDistances(50)).toEqual([5, 10, 25, 50]);
    expect(ringDistances(24)).toEqual([5, 10]);
    expect(ringDistances(10)).toEqual([5, 10]);
  });

  it('keeps every ring inside the range across the zoom span', () => {
    for (let km = 10; km <= 50; km++) {
      ringDistances(km).forEach(r => expect(r).toBeLessThanOrEqual(km));
    }
  });
});
