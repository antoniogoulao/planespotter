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

  useEffect(() => {
    async function poll() {
      const loc = locRef.current;
      if (!loc) return;
      try {
        const fresh = await fetchAircraft(loc.lat, loc.lon);
        const now = Date.now();
        fresh.forEach(ac => store.current.set(ac.icao24, { ...ac, lastUpdate: now }));
        for (const [id, ac] of store.current) {
          if (now - ac.lastUpdate > STALE_MS) store.current.delete(id);
        }
      } catch {
        // keep last known data on network error
      }
    }

    function tick() {
      if (!locRef.current) return;
      const now = Date.now();
      setAircraft(
        Array.from(store.current.values()).map(ac => deadReckon(ac, now)),
      );
    }

    poll();
    tick();
    const pollId = setInterval(poll, POLL_MS);
    const drId = setInterval(tick, DR_MS);

    return () => {
      clearInterval(pollId);
      clearInterval(drId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return aircraft;
}
