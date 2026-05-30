import { useEffect, useRef, useState } from 'react';
import { Route } from '../types';
import { fetchRoute } from '../api/adsbdb';

export function useRoutes(callsigns: string[]): Map<string, Route | null> {
  const fetched = useRef<Set<string>>(new Set());
  const cache = useRef<Map<string, Route | null>>(new Map());
  const [routes, setRoutes] = useState<Map<string, Route | null>>(new Map());

  const depKey = [...callsigns].sort().join(',');

  useEffect(() => {
    const newCs = callsigns.filter(cs => cs && !fetched.current.has(cs));
    if (newCs.length === 0) return;

    newCs.forEach(cs => fetched.current.add(cs));

    void (async () => {
      await Promise.all(
        newCs.map(async cs => {
          const route = await fetchRoute(cs);
          cache.current.set(cs, route);
        }),
      );
      setRoutes(new Map(cache.current));
    })();
  }, [depKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return routes;
}
