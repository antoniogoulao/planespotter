import { Aircraft } from '../types';

export async function fetchAircraft(lat: number, lon: number): Promise<Aircraft[]> {
  const res = await fetch(`/api/states?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error(`fetchAircraft failed: ${res.status}`);
  const data = await res.json() as { aircraft: Aircraft[] };
  return data.aircraft;
}
