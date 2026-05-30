# Milestone 5 — Route Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich each live aircraft with departure → destination route data from the adsbdb public API and display `LIS→AMS` as a third line on every radar blip where a route is known.

**Architecture:** `fetchRoute` calls adsbdb directly (no proxy needed — public API, no CORS issue in React Native). `useRoutes` lazily fetches missing callsigns via a session-scoped cache; its effect dep key is a sorted joined string so the effect only re-runs when the *set* of callsigns changes, not on every 1 Hz dead-reckoning tick. `radar.tsx` derives callsigns from aircraft, calls `useRoutes`, and passes the route map down to `RadarView` → `AirlineTag`.

**Tech Stack:** adsbdb public REST API, React hooks (`useRef`, `useState`, `useEffect`), `@testing-library/react-native` (`renderHook`/`waitFor`), jest-expo, TypeScript strict.

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Fill in | `src/api/adsbdb.ts` | `fetchRoute(callsign): Promise<Route \| null>` |
| Create | `src/hooks/useRoutes.ts` | Lazy-fetch hook, session cache, returns `Map<callsign, Route \| null>` |
| Modify | `src/components/AirlineTag.tsx` | Add `route?: Route \| null` prop; render third line |
| Modify | `src/components/RadarView.tsx` | Add `routes?: Map<string, Route \| null>` prop; pass to AirlineTag |
| Modify | `app/radar.tsx` | Call `useRoutes`, pass routes to RadarView |
| Create | `__tests__/adsbdb.test.ts` | Unit tests for `fetchRoute` |
| Create | `__tests__/useRoutes.test.ts` | Hook tests for `useRoutes` |

---

## Context for all tasks

Types already in `src/types.ts`:
```ts
export interface Airport { iata: string; icao: string; name: string; city: string }
export interface Route { origin: Airport; destination: Airport }
```

adsbdb response shapes:
```ts
// Found:
{ response: { callsign: string; origin: AdsbDbAirport; destination: AdsbDbAirport } }
// Not found:
{ response: false }

// adsbdb airport fields → our Airport fields:
// iata_code → iata
// icao_code → icao
// name      → name
// municipality → city
```

---

### Task 1: `fetchRoute` with tests

**Files:**
- Fill in: `src/api/adsbdb.ts` (currently stub: `// Milestone 5\nexport {};`)
- Create: `__tests__/adsbdb.test.ts`

---

- [ ] **Step 1.1: Write failing tests**

Create `__tests__/adsbdb.test.ts`:

```ts
import { fetchRoute } from '../src/api/adsbdb';

const MOCK_LIS = {
  iata_code: 'LIS', icao_code: 'LPPT',
  name: 'Humberto Delgado Airport', municipality: 'Lisbon',
  country_iso_name: 'PT', country_name: 'Portugal',
  elevation: 114, latitude: 38.7813, longitude: -9.13592,
};

const MOCK_AMS = {
  iata_code: 'AMS', icao_code: 'EHAM',
  name: 'Amsterdam Airport Schiphol', municipality: 'Amsterdam',
  country_iso_name: 'NL', country_name: 'Netherlands',
  elevation: -11, latitude: 52.308601, longitude: 4.76389,
};

describe('fetchRoute', () => {
  beforeEach(() => { global.fetch = jest.fn(); });
  afterEach(() => { jest.restoreAllMocks(); });

  it('calls the correct adsbdb URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: false }),
    });
    await fetchRoute('TAP1234');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.adsbdb.com/v0/callsign/TAP1234',
    );
  });

  it('returns a Route with mapped fields when callsign is found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: { callsign: 'TAP1234', origin: MOCK_LIS, destination: MOCK_AMS },
      }),
    });
    const route = await fetchRoute('TAP1234');
    expect(route).toEqual({
      origin:      { iata: 'LIS', icao: 'LPPT', name: 'Humberto Delgado Airport', city: 'Lisbon' },
      destination: { iata: 'AMS', icao: 'EHAM', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam' },
    });
  });

  it('returns null when response is false (callsign not found)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: false }),
    });
    expect(await fetchRoute('ZZZ999')).toBeNull();
  });

  it('returns null on non-200 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 429 });
    expect(await fetchRoute('TAP1234')).toBeNull();
  });

  it('returns null on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));
    expect(await fetchRoute('TAP1234')).toBeNull();
  });
});
```

- [ ] **Step 1.2: Run tests — confirm all fail**

```bash
npm test -- --testPathPattern=adsbdb
```

Expected: 5 FAIL (`fetchRoute` not exported).

- [ ] **Step 1.3: Implement `src/api/adsbdb.ts`**

```ts
import { Airport, Route } from '../types';

interface AdsbDbAirport {
  iata_code: string;
  icao_code: string;
  name: string;
  municipality: string;
  [key: string]: unknown;
}

interface AdsbDbResponse {
  response: false | {
    callsign: string;
    origin: AdsbDbAirport;
    destination: AdsbDbAirport;
  };
}

function mapAirport(a: AdsbDbAirport): Airport {
  return {
    iata: a.iata_code,
    icao: a.icao_code,
    name: a.name,
    city: a.municipality,
  };
}

export async function fetchRoute(callsign: string): Promise<Route | null> {
  try {
    const res = await fetch(
      `https://api.adsbdb.com/v0/callsign/${encodeURIComponent(callsign)}`,
    );
    if (!res.ok) return null;
    const data = await res.json() as AdsbDbResponse;
    if (!data.response) return null;
    return {
      origin: mapAirport(data.response.origin),
      destination: mapAirport(data.response.destination),
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 1.4: Run tests — confirm all pass**

```bash
npm test -- --testPathPattern=adsbdb
```

Expected: 5/5 PASS.

- [ ] **Step 1.5: Run all tests — no regressions**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 1.6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.7: Commit**

```bash
git add src/api/adsbdb.ts __tests__/adsbdb.test.ts
git commit -m "feat(M5): implement fetchRoute with adsbdb API and tests"
```

---

### Task 2: `useRoutes` hook with tests

**Files:**
- Create: `src/hooks/useRoutes.ts`
- Create: `__tests__/useRoutes.test.ts`

---

- [ ] **Step 2.1: Write failing tests**

Create `__tests__/useRoutes.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useRoutes } from '../src/hooks/useRoutes';
import * as adsbdb from '../src/api/adsbdb';

const MOCK_ROUTE = {
  origin:      { iata: 'LIS', icao: 'LPPT', name: 'Lisbon Airport', city: 'Lisbon' },
  destination: { iata: 'AMS', icao: 'EHAM', name: 'Amsterdam Airport', city: 'Amsterdam' },
};

describe('useRoutes', () => {
  beforeEach(() => {
    jest.spyOn(adsbdb, 'fetchRoute').mockResolvedValue(MOCK_ROUTE);
  });
  afterEach(() => jest.restoreAllMocks());

  it('returns the route for a known callsign', async () => {
    const { result } = renderHook(() => useRoutes(['TAP1234']));
    await waitFor(() => expect(result.current.get('TAP1234')).toEqual(MOCK_ROUTE));
  });

  it('fetches each callsign exactly once across re-renders', async () => {
    const { result, rerender } = renderHook(
      ({ cs }: { cs: string[] }) => useRoutes(cs),
      { initialProps: { cs: ['TAP1234'] } },
    );
    await waitFor(() => expect(result.current.get('TAP1234')).toBeDefined());
    rerender({ cs: ['TAP1234'] });
    expect(adsbdb.fetchRoute).toHaveBeenCalledTimes(1);
  });

  it('stores null for callsigns with no route', async () => {
    jest.spyOn(adsbdb, 'fetchRoute').mockResolvedValue(null);
    const { result } = renderHook(() => useRoutes(['ZZZ999']));
    await waitFor(() => expect(result.current.has('ZZZ999')).toBe(true));
    expect(result.current.get('ZZZ999')).toBeNull();
  });

  it('fetches new callsigns when they are added', async () => {
    const { result, rerender } = renderHook(
      ({ cs }: { cs: string[] }) => useRoutes(cs),
      { initialProps: { cs: ['TAP1234'] } },
    );
    await waitFor(() => expect(result.current.get('TAP1234')).toBeDefined());
    rerender({ cs: ['TAP1234', 'KLM001'] });
    await waitFor(() => expect(result.current.get('KLM001')).toBeDefined());
    expect(adsbdb.fetchRoute).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2.2: Run tests — confirm all fail**

```bash
npm test -- --testPathPattern=useRoutes
```

Expected: 4 FAIL (`useRoutes` not found).

- [ ] **Step 2.3: Implement `src/hooks/useRoutes.ts`**

```ts
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
```

- [ ] **Step 2.4: Run tests — confirm all pass**

```bash
npm test -- --testPathPattern=useRoutes
```

Expected: 4/4 PASS.

- [ ] **Step 2.5: Run all tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 2.6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.7: Commit**

```bash
git add src/hooks/useRoutes.ts __tests__/useRoutes.test.ts
git commit -m "feat(M5): implement useRoutes lazy-fetch hook with session cache"
```

---

### Task 3: Add route line to `AirlineTag`

**Files:**
- Modify: `src/components/AirlineTag.tsx`

The current label group shows callsign at `y=4` and FL at `y=14`. The route line goes at `y=24`.

---

- [ ] **Step 3.1: Add `Route` import and `route` prop**

In `src/components/AirlineTag.tsx`:

Add `Route` to the types import:
```ts
import { Ident, Route } from '../types';
```

Add `route` to `AirlineTagProps`:
```ts
export interface AirlineTagProps {
  ident: Ident;
  callsign: string;
  alt: number;
  x: number;
  y: number;
  heading: number;
  labelRotation: number;
  route?: Route | null;
}
```

Add `route = null` to the destructuring:
```ts
export function AirlineTag({
  ident, callsign, alt, x, y, heading, labelRotation, route = null,
}: AirlineTagProps) {
```

- [ ] **Step 3.2: Add the route line inside the label `<G>`**

Inside the label group (`<G transform={rotate(labelRotation)}>`), immediately after the FL `<SvgText>` at `y={14}`, add:

```tsx
        {/* Route — departure → destination, shown when available */}
        {route?.origin.iata && route?.destination.iata && (
          <SvgText
            x={BADGE_X + BADGE_W + 8}
            y={24}
            fill="#9ca3af"
            fontSize={7}
            fontFamily="monospace"
          >
            {route.origin.iata}→{route.destination.iata}
          </SvgText>
        )}
```

- [ ] **Step 3.3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.4: Run all tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 3.5: Commit**

```bash
git add src/components/AirlineTag.tsx
git commit -m "feat(M5): add departure→destination route line to AirlineTag"
```

---

### Task 4: Add `routes` prop to `RadarView`

**Files:**
- Modify: `src/components/RadarView.tsx`

---

- [ ] **Step 4.1: Add `Route` import and `routes` prop**

Add `Route` to the types import in `RadarView.tsx`:
```ts
import { Aircraft, Route } from '../types';
```

Add `routes` to `RadarViewProps`:
```ts
export interface RadarViewProps {
  location: { lat: number; lon: number } | null;
  azimuth: number | null;
  aircraft: Aircraft[];
  rangeKm?: number;
  routes?: Map<string, Route | null>;
}
```

Add `routes = new Map()` to the destructuring:
```ts
export function RadarView({ location, azimuth, aircraft, rangeKm = 50, routes = new Map() }: RadarViewProps) {
```

- [ ] **Step 4.2: Pass route to each AirlineTag**

In the blip map, change:
```tsx
              return (
                <AirlineTag
                  key={ac.icao24}
                  ident={identify(ac.callsign)}
                  callsign={ac.callsign}
                  alt={ac.alt}
                  x={x}
                  y={y}
                  heading={ac.heading}
                  labelRotation={-discRotation}
                />
              );
```

To:
```tsx
              return (
                <AirlineTag
                  key={ac.icao24}
                  ident={identify(ac.callsign)}
                  callsign={ac.callsign}
                  alt={ac.alt}
                  x={x}
                  y={y}
                  heading={ac.heading}
                  labelRotation={-discRotation}
                  route={routes.get(ac.callsign) ?? null}
                />
              );
```

- [ ] **Step 4.3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.4: Run all tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 4.5: Commit**

```bash
git add src/components/RadarView.tsx
git commit -m "feat(M5): pass route map through RadarView to AirlineTag"
```

---

### Task 5: Wire `useRoutes` into `radar.tsx`

**Files:**
- Modify: `app/radar.tsx`

---

- [ ] **Step 5.1: Add imports and hook call**

Add `useRoutes` import:
```ts
import { useRoutes } from '../src/hooks/useRoutes';
```

In `RadarScreen`, after `useAircraft`:
```ts
const aircraft = useAircraft(location);
const callsigns = aircraft.map(ac => ac.callsign).filter(Boolean);
const routes = useRoutes(callsigns);
```

- [ ] **Step 5.2: Pass `routes` to RadarView**

Change:
```tsx
      <RadarView location={location} azimuth={azimuth} aircraft={aircraft} />
```

To:
```tsx
      <RadarView location={location} azimuth={azimuth} aircraft={aircraft} routes={routes} />
```

- [ ] **Step 5.3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5.4: Run all tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 5.5: Commit**

```bash
git add app/radar.tsx
git commit -m "feat(M5): wire useRoutes into RadarScreen — route enrichment live"
```

---

### Task 6: Verify on device

- [ ] **Step 6.1: Run on device**

```bash
npx expo run:ios --device
```

(Ensure `node server/proxy.mjs` is running for live aircraft.)

- [ ] **Step 6.2: Verify acceptance criteria**

- [ ] Live blips show a third grey line `LIS→AMS` (or equivalent) within ~5 s of appearing
- [ ] Callsigns with no known route show no third line — no placeholder text
- [ ] Opening the app, watching a callsign for 60 s — the route is only fetched once (no repeated network calls for the same callsign)
- [ ] All existing badge, callsign, and FL lines still render correctly
- [ ] `npx tsc --noEmit` passes; all tests pass

---

## Self-Review

**Spec coverage:**
- ✅ `fetchRoute`: adsbdb URL, `response: false` → null, non-200 → null, network error → null, field mapping
- ✅ `useRoutes`: `fetched` ref prevents duplicate requests, `cache` ref persists results, `depKey` stable across dead-reckoning ticks, `Promise.all` concurrent fetch, `setRoutes` once after all complete
- ✅ `AirlineTag`: `route?: Route | null` prop (default null), third line at `y=24`, guard for empty IATA codes
- ✅ `RadarView`: `routes?: Map<string, Route | null>` prop (default `new Map()`), passes `routes.get(ac.callsign) ?? null` to each tag
- ✅ `radar.tsx`: derives callsigns from aircraft, calls `useRoutes`, passes routes to RadarView

**Placeholder scan:** None found.

**Type consistency:**
- `fetchRoute` returns `Promise<Route | null>` — matches `useRoutes` cache type `Map<string, Route | null>` ✓
- `AirlineTag` prop `route?: Route | null` — `RadarView` passes `routes.get(ac.callsign) ?? null` which is `Route | null` ✓
- `RadarView` prop `routes?: Map<string, Route | null>` — `radar.tsx` passes `routes` returned from `useRoutes` which is `Map<string, Route | null>` ✓
