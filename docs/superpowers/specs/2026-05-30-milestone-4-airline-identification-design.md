# Milestone 4 — Airline Identification + Tags Design

**Goal:** Identify each aircraft's callsign as an airline, military, or unknown, and display a compact inline tag (logo placeholder + callsign) on every radar blip.

---

## Architecture

Three files change in M4.

| File | Change |
|---|---|
| `src/lib/airlines.ts` | FILL IN — `identify(callsign): Ident`, imports `airlines.json`, military prefix set |
| `src/components/AirlineTag.tsx` | FILL IN — SVG group: logo or placeholder rect, callsign text, upright counter-rotation |
| `src/components/RadarView.tsx` | MODIFY — call `identify()` per blip, render `<AirlineTag>` instead of bare text |

`radar.tsx` is unchanged — it still passes raw `Aircraft[]` to `RadarView`; identification happens inside the view layer.

The static logo require map lives inside `AirlineTag.tsx`. Adding a new airline logo = drop the PNG in `assets/logos/` and add one line to the map.

---

## `identify()` — `src/lib/airlines.ts`

```ts
export function identify(callsign: string): Ident
```

### Algorithm (in order)

1. **Guard** — if `callsign` is empty or whitespace, return `{ kind: 'na', code: null, name: 'N/A' }`.

2. **Military check** — extract `prefix = callsign.slice(0, 3).toUpperCase()`. If `prefix` is in `MILITARY_PREFIXES` (a `Set<string>`), return `{ kind: 'military', code: prefix, name: 'Military' }`.

3. **Airline lookup** — look up `prefix` in the imported `airlines.json` map. If found, return `{ kind: 'airline', code: prefix, name: entry.name, iata: entry.iata || undefined }`.

4. **Fallback** — return `{ kind: 'na', code: prefix, name: 'N/A' }`.

### Military prefix set

```ts
const MILITARY_PREFIXES = new Set([
  'RRR',  // UK Royal Air Force
  'CMF',  // French Air Force
  'NAF',  // US Naval Air Forces
  'GAF',  // German Air Force
  'BAF',  // Belgian Air Force
  'FAF',  // Finnish Air Force
  'IAF',  // Irish Air Corps / Indian Air Force
  'SVF',  // Swedish Air Force
  'RFF',  // French Navy
  'MMF',  // Italian Air Force
  'HAF',  // Hellenic (Greek) Air Force
  'PAF',  // Polish Air Force
  'DAF',  // Danish Air Force
  'NOR',  // Norwegian Air Force
  'POR',  // Portuguese Air Force
  'SAF',  // South African Air Force
  'UAF',  // Ukrainian Air Force
  'CTM',  // Czech Air Force
  'SQF',  // Qatari Air Force
  'MJF',  // Moroccan Royal Air Force
  'RFR',  // Russian Air Force
  'CAF',  // Canadian Armed Forces
  'AAR',  // US Army
  'HVK',  // Hungarian Air Force
]);
```

### Data import

```ts
import airlinesData from '../../assets/airlines.json';

type AirlineEntry = { name: string; iata: string };
const AIRLINES = airlinesData as Record<string, AirlineEntry>;
```

`airlines.json` is bundled at build time — no async loading, no network call.

---

## `AirlineTag` — `src/components/AirlineTag.tsx`

### Props

```ts
interface AirlineTagProps {
  ident: Ident;
  callsign: string;
  x: number;           // SVG x position (blip centre)
  y: number;           // SVG y position (blip centre)
  heading: number;     // aircraft heading — rotates the arrow
  labelRotation: number; // degrees to apply to label so it stays upright on the rotating disc
                         // RadarView passes -discRotation here (= azimuth ?? 0)
}
```

### Static logo map

```ts
const LOGO_MAP: Record<string, ReturnType<typeof require>> = {
  DLH: require('../../assets/logos/GEC.png'),
  KLM: require('../../assets/logos/KLM.png'),
  TAP: require('../../assets/logos/TAP.png'),
};
```

Only keys with a corresponding PNG in `assets/logos/` are listed. No runtime `require()` errors are possible since the map is static.

### Rendering

The component renders an SVG `<G>` at `(x, y)`. Structure:

1. **Arrow** — `<G transform={rotate(heading)}><Polygon .../></G>` — NOT counter-rotated; it points in the aircraft's absolute heading direction (same as the current blip implementation).
2. **Label group** — `<G transform={rotate(labelRotation)}>` — counter-rotates the logo and callsign text so they stay upright as the disc spins.

**Logo/badge area** — 24 × 14 px, offset 10 px right of blip centre:

| Condition | Renders |
|---|---|
| `ident.kind === 'airline'` AND `LOGO_MAP[ident.code]` exists | `<Image>` with the require'd PNG, width=24 height=14 |
| `ident.kind === 'airline'` AND no logo | Grey `<Rect>` (fill `#1f2937`, stroke `#374151`) with 6 px ICAO code text centred |
| `ident.kind === 'military'` | Purple `<Rect>` (fill `#312e81`, stroke `#6d28d9`) with 6 px `MIL` text centred in `#c4b5fd` |
| `ident.kind === 'na'` | Grey `<Rect>` with `N/A` text |

**Callsign text** — 8 px right of the logo rect: yellow (`#facc15`), 8 px, monospace, trimmed.

### Layout summary

```
[arrow]  [logo/badge 24×14]  [callsign text]
         ← 10 px →           ← 8 px gap →
```

---

## `RadarView` changes

In the aircraft blips map, replace:

```tsx
<G key={ac.icao24} transform={`translate(${x}, ${y})`}>
  <G transform={`rotate(${ac.heading})`}>
    <Polygon points="0,-7 -4,4 0,2 4,4" fill="#facc15" />
  </G>
  <G transform={`rotate(${-discRotation})`}>
    <SvgText x={8} y={4} fill="#facc15" fontSize={8} fontFamily="monospace">
      {ac.callsign.trim()}
    </SvgText>
  </G>
</G>
```

With:

```tsx
<AirlineTag
  key={ac.icao24}
  ident={identify(ac.callsign)}
  callsign={ac.callsign}
  x={x}
  y={y}
  heading={ac.heading}
  labelRotation={-discRotation}
/>
```

`AirlineTag` owns the full blip rendering: arrow (heading-rotated) + label (counter-rotated).

`RadarView` adds two imports:
```ts
import { AirlineTag } from './AirlineTag';
import { identify } from '../lib/airlines';
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Empty or whitespace callsign | `identify` returns `kind: 'na'` immediately |
| Unknown prefix (not airline, not military) | Falls through to `kind: 'na'`, grey `N/A` badge |
| No logo file for a known airline | Grey placeholder rect with ICAO code — no crash |
| `ident.iata` absent | `iata` is optional in `Ident`; `AirlineTag` ignores it |

---

## Acceptance Criteria

- [ ] Live radar blips show logo-or-placeholder inline with the callsign (Option B layout)
- [ ] TAP, KLM, DLH blips show their actual PNG logo
- [ ] All other airline blips show a grey placeholder with their 3-letter ICAO code
- [ ] Known military callsigns show a purple `MIL` badge
- [ ] Unknown callsigns show a grey `N/A` badge
- [ ] All labels stay upright as the radar disc rotates
- [ ] `npx tsc --noEmit` passes
- [ ] All existing tests pass (28/28)
