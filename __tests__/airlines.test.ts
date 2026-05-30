import { identify } from '../src/lib/airlines';

describe('identify', () => {
  it('returns na for empty callsign', () => {
    expect(identify('')).toEqual({ kind: 'na', code: null, name: 'N/A' });
  });

  it('returns na for whitespace-only callsign', () => {
    expect(identify('   ')).toEqual({ kind: 'na', code: null, name: 'N/A' });
  });

  it('returns airline for known ICAO prefix TAP', () => {
    const r = identify('TAP1234');
    expect(r.kind).toBe('airline');
    expect(r.code).toBe('TAP');
    expect(typeof r.name).toBe('string');
    expect(r.name.length).toBeGreaterThan(0);
  });

  it('returns military for prefix RRR (RAF)', () => {
    expect(identify('RRR001')).toMatchObject({
      kind: 'military',
      code: 'RRR',
      name: 'Military',
    });
  });

  it('returns na with code for unknown prefix', () => {
    const r = identify('QWE999');
    expect(r.kind).toBe('na');
    expect(r.code).toBe('QWE');
    expect(r.name).toBe('N/A');
  });

  it('is case-insensitive — lowercase callsign works', () => {
    const upper = identify('TAP1234');
    const lower = identify('tap1234');
    expect(lower).toEqual(upper);
  });

  it('returns airline for DLH (Lufthansa) prefix', () => {
    const r = identify('DLH400');
    expect(r.kind).toBe('airline');
    expect(r.code).toBe('DLH');
  });
});
