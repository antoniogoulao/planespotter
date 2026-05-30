import { useEffect, useRef, useState } from 'react';
import { Aircraft } from '../types';
import { fetchAircraft } from '../api/opensky';
import { offsetPosition } from '../lib/geo';

const POLL_MS = 10_000;
const DR_MS = 1_000;
const STALE_MS = 60_000;

export function deadReckon(ac: Aircraft, nowMs: number): Aircraft {
  const elapsed = (nowMs - ac.lastUpdate) / 1000;
  if (elapsed <= 0) return ac;
  const pos = offsetPosition(
    { lat: ac.lat, lon: ac.lon },
    ac.heading,
    ac.velocity * elapsed,
  );
  return { ...ac, lat: pos.lat, lon: pos.lon };
}

export function useAircraft(
  location: { lat: number; lon: number } | null,
): Aircraft[] {
  const store = useRef<Map<string, Aircraft>>(new Map());
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const locRef = useRef(location);
  locRef.current = location;

  // Store poll in a ref so both effects can invoke it
  const pollRef = useRef(async () => {
    const loc = locRef.current;
    if (!loc) return;
    try {
      const fresh = await fetchAircraft(loc.lat, loc.lon);
      // Preserve the OpenSky timestamp — dead reckoning must account for data age
      fresh.forEach(ac => store.current.set(ac.icao24, ac));
      const now = Date.now();
      for (const [id, ac] of store.current) {
        if (now - ac.lastUpdate > STALE_MS) store.current.delete(id);
      }
    } catch (err) {
      // keep last known data on network error
      if (__DEV__) console.warn('[useAircraft] poll error:', err);
    }
  });

  // Start interval-based polling + DR tick once on mount
  useEffect(() => {
    function tick() {
      if (!locRef.current) return;
      const now = Date.now();
      setAircraft(
        Array.from(store.current.values()).map(ac => deadReckon(ac, now)),
      );
    }

    void pollRef.current();
    tick();
    const pollId = setInterval(() => void pollRef.current(), POLL_MS);
    const drId = setInterval(tick, DR_MS);

    return () => {
      clearInterval(pollId);
      clearInterval(drId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire an immediate poll whenever location first becomes non-null
  // (covers the case where location permission is granted after mount)
  useEffect(() => {
    if (location) void pollRef.current();
  }, [location?.lat, location?.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  return aircraft;
}
