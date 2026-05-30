# Milestone 5 — Route Enrichment Design

**Goal:** Enrich each live aircraft with its departure → destination route from the adsbdb public API, and display `LIS→AMS` as a third line on every radar blip where a route is known.

---

## Architecture

Five files change in M5.

| File | Change |
|---|---|
| `src/api/adsbdb.ts` | FILL IN — `fetchRoute(callsign): Promise<Route \| null>` |
| `src/hooks/useRoutes.ts` | CREATE — lazy-fetch hook, returns `Map<callsign, Route \| null>` |
| `app/radar.tsx` | MODIFY — call `useRoutes`, pass map to RadarView |
| `src/components/RadarView.tsx` | MODIFY — accept `routes` prop, pass each aircraft's route to AirlineTag |
| `src/components/AirlineTag.tsx` | MODIFY — accept `route` prop, render third line |

`radar.tsx` is the single source of truth for all data. `RadarView` remains a pure display component.

---

## `fetchRoute` — `src/api/adsbdb.ts`

```ts
export async function fetchRoute(callsign: string): Promise<Route | null>
```

**Request:** `GET https://api.adsbdb.com/v0/callsign/{callsign}`

No authentication. Public API.

**Response when found:**
```json
{
  "response": {
    "callsign": "TAP1234",
    "origin": {
      "iata_code": "LIS", "icao_code": "LPPT",
      "name": "Humberto Delgado Airport", "municipality": "Lisbon",
      ...
    },
    "destination": {
      "iata_code": "AMS", "icao_code": "EHAM",
      "name": "Amsterdam Airport Schiphol", "municipality": "Amsterdam",
      ...
    }
  }
}
```

**Response when not found:** `{ "response": false }`

**Mapping to our types:**

| adsbdb field | `Airport` field |
|---|---|
| `iata_code` | `iata` |
| `icao_code` | `icao` |
| `name` | `name` |
| `municipality` | `city` |

**Return value:**
- Found → `Route { origin: Airport; destination: Airport }`
- `response === false` → `null`
- Network error / non-200 → `null` (swallowed)

---

## `useRoutes` — `src/hooks/useRoutes.ts`

```ts
export function useRoutes(callsigns: string[]): Map<string, Route | null>
```

### Internal state

| Name | Type | Purpose |
|---|---|---|
| `fetched` | `useRef<Set<string>>` | All callsigns ever dispatched — prevents duplicate in-flight requests |
| `cache` | `useRef<Map<string, Route \| null>>` | Completed fetch results — persists for the session |
| `routes` | `useState<Map<string, Route \| null>>` | Snapshot returned to callers — triggers re-renders |

### Effect

Dep key: `[...callsigns].sort().join(',')` — the effect only re-runs when the *set* of callsigns changes, not on every 1 Hz dead-reckoning tick.

On each run:
1. Filter to callsigns not yet in `fetched.current`
2. Add them all to `fetched.current` immediately (prevents duplicates even while fetch is in-flight)
3. Fetch all concurrently via `Promise.all(newCs.map(cs => fetchRoute(cs)))`
4. Write each result into `cache.current`
5. Call `setRoutes(new Map(cache.current))` once

### Semantics of the returned map

| Entry state | Meaning |
|---|---|
| Absent from map | Not yet fetched (first render, or aircraft just entered range) |
| `null` value | Fetched — route not found |
| `Route` value | Fetched — route available |

`AirlineTag` treats absent and `null` identically: no route line shown.

---

## `radar.tsx` changes

```tsx
const aircraft = useAircraft(location);
const callsigns = aircraft.map(ac => ac.callsign).filter(Boolean);
const routes = useRoutes(callsigns);
```

`callsigns` is derived inline — a new array on every render. The stability guarantee lives inside `useRoutes`: its effect dep key is `[...callsigns].sort().join(',')`, which only changes when the *set* of callsigns changes (aircraft enter or leave range), not on every 1 Hz dead-reckoning tick. Pass both `aircraft` and `routes` to `<RadarView>`.

---

## `RadarView` changes

New prop added to `RadarViewProps`:

```ts
routes?: Map<string, Route | null>; // default: new Map()
```

In the blip map, pass:
```tsx
route={routes?.get(ac.callsign) ?? null}
```

to each `<AirlineTag>`.

---

## `AirlineTag` changes

New prop:

```ts
route?: Route | null; // default: null
```

Third label line — rendered only when `route` is non-null and both IATA codes are non-empty:

```tsx
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

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `{ "response": false }` | `fetchRoute` returns `null`; no route line |
| Network error / non-200 | `fetchRoute` returns `null`; no route line |
| Either IATA code is empty | Guard in `AirlineTag`: route line not rendered |
| Aircraft leaves range, re-enters | Already in `fetched` — no re-fetch; cached result reused |
| `routes` prop absent from RadarView | Defaults to `new Map()`; no route lines shown |

---

## Acceptance Criteria

- [ ] `npx expo run:ios --device` builds and runs
- [ ] Live blips show `LIS→AMS` (or equivalent) as a third line within ~5 s of the aircraft appearing
- [ ] Callsigns with no known route show no third line (no placeholder text)
- [ ] A callsign is never requested twice (verified by adding a temporary log)
- [ ] `npx tsc --noEmit` passes; all existing tests pass
