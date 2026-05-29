import { normaliseState } from '../src/api/opensky-normalise';

const VALID: unknown[] = [
  'abc123', 'BAW001 ', 'UK', 999, 1000,
  -0.1, 51.5, 8000, false, 250, 90, -5,
  null, 8200, '1234', false, 0,
];

describe('normaliseState', () => {
  it('maps a valid state vector to Aircraft', () => {
    const result = normaliseState(VALID);
    expect(result).toMatchObject({
      icao24: 'abc123',
      callsign: 'BAW001',
      lat: 51.5,
      lon: -0.1,
      alt: 8000,
      velocity: 250,
      heading: 90,
      verticalRate: -5,
      lastUpdate: 1_000_000,
    });
  });

  it('returns null when on_ground is true', () => {
    const s = [...VALID]; s[8] = true;
    expect(normaliseState(s)).toBeNull();
  });

  it('returns null when lat is null', () => {
    const s = [...VALID]; s[6] = null;
    expect(normaliseState(s)).toBeNull();
  });

  it('returns null when lon is null', () => {
    const s = [...VALID]; s[5] = null;
    expect(normaliseState(s)).toBeNull();
  });

  it('returns null when alt is null', () => {
    const s = [...VALID]; s[7] = null;
    expect(normaliseState(s)).toBeNull();
  });

  it('trims callsign whitespace', () => {
    const s = [...VALID]; s[1] = '  RYR123 ';
    expect(normaliseState(s)?.callsign).toBe('RYR123');
  });

  it('defaults velocity/heading/verticalRate to 0 when null', () => {
    const s = [...VALID]; s[9] = null; s[10] = null; s[11] = null;
    const r = normaliseState(s);
    expect(r?.velocity).toBe(0);
    expect(r?.heading).toBe(0);
    expect(r?.verticalRate).toBe(0);
  });
});
