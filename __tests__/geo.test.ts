import { haversineDistance, bearingTo, offsetPosition } from '../src/lib/geo';

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistance({ lat: 48.8566, lon: 2.3522 }, { lat: 48.8566, lon: 2.3522 })).toBe(0);
  });

  it('returns ~111 195 m for 1 degree of latitude', () => {
    const d = haversineDistance({ lat: 0, lon: 0 }, { lat: 1, lon: 0 });
    expect(d).toBeCloseTo(111_195, -2);
  });

  it('Paris → London is ~341 550 m', () => {
    const d = haversineDistance(
      { lat: 48.8566, lon: 2.3522 },
      { lat: 51.5074, lon: -0.1278 },
    );
    expect(d).toBeCloseTo(343_556, -2);
  });
});

describe('bearingTo', () => {
  it('north is 0°', () => {
    expect(bearingTo({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(0, 0);
  });

  it('east is 90°', () => {
    expect(bearingTo({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(90, 0);
  });

  it('south is 180°', () => {
    expect(bearingTo({ lat: 1, lon: 0 }, { lat: 0, lon: 0 })).toBeCloseTo(180, 0);
  });

  it('west is 270°', () => {
    expect(bearingTo({ lat: 0, lon: 1 }, { lat: 0, lon: 0 })).toBeCloseTo(270, 0);
  });
});

describe('offsetPosition', () => {
  it('moving 0 m returns the same coordinates', () => {
    const result = offsetPosition({ lat: 48.8566, lon: 2.3522 }, 0, 0);
    expect(result.lat).toBeCloseTo(48.8566, 4);
    expect(result.lon).toBeCloseTo(2.3522, 4);
  });

  it('moving 1000 m north increases latitude', () => {
    const result = offsetPosition({ lat: 48.8566, lon: 2.3522 }, 0, 1000);
    expect(result.lat).toBeGreaterThan(48.8566);
    expect(result.lon).toBeCloseTo(2.3522, 3);
  });

  it('round-trip: haversineDistance of offsetPosition result ≈ input metres', () => {
    const from = { lat: 48.8566, lon: 2.3522 };
    const to = offsetPosition(from, 45, 500);
    expect(haversineDistance(from, to)).toBeCloseTo(500, 0);
  });
});
