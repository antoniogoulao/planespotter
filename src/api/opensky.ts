import Constants from 'expo-constants';
import { Aircraft } from '../types';

// In development, find the Mac's LAN IP so we can reach server/proxy.mjs on
// port 3001. Tries several Expo Constants fields across SDK versions.
// If none work, set EXPO_PUBLIC_PROXY_URL=http://YOUR_MAC_IP:3001 in .env.local.
function proxyBase(): string {
  if (!__DEV__) return process.env.EXPO_PUBLIC_PROXY_URL ?? '';

  const hostCandidates: Array<string | undefined> = [
    // SDK 46+ dev build
    (Constants as any).expoConfig?.hostUri,
    // SDK 44 and below
    (Constants as any).manifest?.debuggerHost,
    // Expo Go / SDK 45+
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost,
    // experienceUrl e.g. "exp://192.168.1.100:8081"
    (Constants as any).experienceUrl,
  ];

  for (const raw of hostCandidates) {
    if (!raw) continue;
    const m = String(raw).match(/:\/\/([^/:]+)|^([^/:]+)/);
    const host = m?.[1] ?? m?.[2];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      console.log('[opensky] proxy host:', host);
      return `http://${host}:3001`;
    }
  }

  const fallback = process.env.EXPO_PUBLIC_PROXY_URL;
  if (!fallback) console.warn('[opensky] Set EXPO_PUBLIC_PROXY_URL=http://YOUR_MAC_IP:3001 in .env.local');
  return fallback ?? '';
}

export async function fetchAircraft(lat: number, lon: number): Promise<Aircraft[]> {
  const url = `${proxyBase()}/api/states?lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchAircraft failed: ${res.status}`);
  const data = await res.json() as { aircraft: Aircraft[] };
  return data.aircraft;
}
