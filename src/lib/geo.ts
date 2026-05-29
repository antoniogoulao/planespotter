import { Geo } from '../types';

const R = 6_371_000; // Earth radius, metres
const DEG = Math.PI / 180;

export function haversineDistance(a: Geo, b: Geo): number {
  const dLat = (b.lat - a.lat) * DEG;
  const dLon = (b.lon - a.lon) * DEG;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bearingTo(from: Geo, to: Geo): number {
  const dLon = (to.lon - from.lon) * DEG;
  const y = Math.sin(dLon) * Math.cos(to.lat * DEG);
  const x =
    Math.cos(from.lat * DEG) * Math.sin(to.lat * DEG) -
    Math.sin(from.lat * DEG) * Math.cos(to.lat * DEG) * Math.cos(dLon);
  return ((Math.atan2(y, x) / DEG) + 360) % 360;
}

export function offsetPosition(from: Geo, bearing: number, metres: number): Geo {
  const d = metres / R;
  const b = bearing * DEG;
  const lat1 = from.lat * DEG;
  const lon1 = from.lon * DEG;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: lat2 / DEG, lon: lon2 / DEG };
}
