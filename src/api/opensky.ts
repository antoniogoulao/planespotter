import { NativeModules } from 'react-native';
import { Aircraft } from '../types';

// In development, find the Mac's LAN IP from the JS bundle URL so we can
// reach the standalone proxy server (server/proxy.mjs) on port 3001.
// In production, fall back to EXPO_PUBLIC_PROXY_URL or a relative URL.
function proxyBase(): string {
  if (__DEV__) {
    try {
      const scriptURL: string | undefined = NativeModules.SourceCode?.scriptURL;
      if (scriptURL) {
        const m = scriptURL.match(/^https?:\/\/([^/:]+)/);
        if (m) return `http://${m[1]}:3001`;
      }
    } catch {}
  }
  return process.env.EXPO_PUBLIC_PROXY_URL ?? '';
}

export async function fetchAircraft(lat: number, lon: number): Promise<Aircraft[]> {
  const url = `${proxyBase()}/api/states?lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchAircraft failed: ${res.status}`);
  const data = await res.json() as { aircraft: Aircraft[] };
  return data.aircraft;
}
