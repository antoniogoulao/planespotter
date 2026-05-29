import { Aircraft } from '../types';

export function normaliseState(s: unknown[]): Aircraft | null {
  const onGround = s[8];
  const lat = s[6];
  const lon = s[5];
  const alt = s[7];
  if (onGround === true || lat == null || lon == null || alt == null) return null;
  return {
    icao24: String(s[0]),
    callsign: String(s[1] ?? '').trim(),
    lat: Number(lat),
    lon: Number(lon),
    alt: Number(alt),
    velocity: Number(s[9] ?? 0),
    heading: Number(s[10] ?? 0),
    verticalRate: Number(s[11] ?? 0),
    lastUpdate: Number(s[4] ?? 0) * 1000,
  };
}
