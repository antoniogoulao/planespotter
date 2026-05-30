import { deadReckon } from '../src/hooks/useAircraft';
import { haversineDistance } from '../src/lib/geo';

const BASE = {
  icao24: 'abc', callsign: 'TST',
  lat: 51.5, lon: -0.1, alt: 10000,
  velocity: 250, heading: 0, verticalRate: 0,
  lastUpdate: 1000,
};

describe('deadReckon', () => {
  it('returns aircraft unchanged when elapsed is 0', () => {
    const r = deadReckon(BASE, 1000);
    expect(r.lat).toBe(51.5);
    expect(r.lon).toBe(-0.1);
  });

  it('moves aircraft north (heading 0°) at 250 m/s for 10 s → ~2500 m', () => {
    const r = deadReckon(BASE, 11_000); // 10 s later
    const dist = haversineDistance({ lat: BASE.lat, lon: BASE.lon }, r);
    expect(dist).toBeCloseTo(2500, -1); // within ~100 m
    expect(r.lat).toBeGreaterThan(BASE.lat);
  });

  it('does not move when velocity is 0', () => {
    const r = deadReckon({ ...BASE, velocity: 0 }, 2000);
    expect(r.lat).toBe(BASE.lat);
    expect(r.lon).toBe(BASE.lon);
  });

  it('preserves all other fields', () => {
    const r = deadReckon(BASE, 2000);
    expect(r.icao24).toBe(BASE.icao24);
    expect(r.callsign).toBe(BASE.callsign);
    expect(r.alt).toBe(BASE.alt);
    expect(r.velocity).toBe(BASE.velocity);
    expect(r.heading).toBe(BASE.heading);
    expect(r.lastUpdate).toBe(BASE.lastUpdate);
  });
});
