# Milestone 4 — Airline Identification + Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Identify each aircraft callsign as airline/military/unknown and render a compact inline tag (logo or badge + callsign text) on every radar blip.

**Architecture:** `identify(callsign)` is a pure function that looks up `assets/airlines.json` (bundled) and a hardcoded military prefix set. `AirlineTag` is an SVG group that owns the full blip render — heading-rotated arrow + counter-rotated label. `RadarView` replaces its inline blip code with `<AirlineTag>`.

**Tech Stack:** react-native-svg (Image, Rect, G, Polygon, Text), TypeScript strict, `assets/airlines.json` (resolveJsonModule already enabled), jest-expo.

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Fill in | `src/lib/airlines.ts` | `identify(callsign): Ident` — airline lookup + military detection |
| Fill in | `src/components/AirlineTag.tsx` | SVG blip: heading arrow + counter-rotated logo/badge + callsign |
| Modify | `src/components/RadarView.tsx` | Replace inline blip `<G>` block with `<AirlineTag>` |
| Create | `__tests__/airlines.test.ts` | Unit tests for `identify()` |

---

## Context for all tasks

Existing types (`src/types.ts`):
```ts
export type IdentKind = 'airline' | 'military' | 'na';
export interface Ident {
  kind: IdentKind;
  code: string | null;
  name: string;
  iata?: string;
}
```

Logos in `assets/logos/`: `DLH.png`, `KLM.png`, `TAP.png` — keyed by ICAO designator.

`airlines.json` shape: `{ "<ICAO>": { "name": string, "iata": string }, ... }` — 3-letter ICAO keys.

---

### Task 1: `identify()` function with tests

**Files:**
- Fill in: `src/lib/airlines.ts` (currently stub: `// Milestone 4\nexport {};`)
- Create: `__tests__/airlines.test.ts`

---

- [ ] **Step 1.1: Write failing tests**

Create `__tests__/airlines.test.ts`:

```ts
import { identify } from '../src/lib/airlines';

describe('identify', () => {
  it('returns na for empty callsign', () => {
    expect(identify('')).toEqual({ kind: 'na', code: null, name: 'N/A' });
  });

  it('returns na for whitespace-only callsign', () => {
    expect(identify('   ')).toEqual({ kind: 'na', code: null, name: 'N/A' });
  });

  it('returns airline for known ICAO prefix TAP', () => {
    const r = identify('TAP1234');
    expect(r.kind).toBe('airline');
    expect(r.code).toBe('TAP');
    expect(typeof r.name).toBe('string');
    expect(r.name.length).toBeGreaterThan(0);
  });

  it('returns military for prefix RRR (RAF)', () => {
    expect(identify('RRR001')).toMatchObject({
      kind: 'military',
      code: 'RRR',
      name: 'Military',
    });
  });

  it('returns na with code for unknown prefix', () => {
    const r = identify('ZZZ999');
    expect(r.kind).toBe('na');
    expect(r.code).toBe('ZZZ');
    expect(r.name).toBe('N/A');
  });

  it('is case-insensitive — lowercase callsign works', () => {
    const upper = identify('TAP1234');
    const lower = identify('tap1234');
    expect(lower).toEqual(upper);
  });

  it('returns airline for DLH (Lufthansa) prefix', () => {
    const r = identify('DLH400');
    expect(r.kind).toBe('airline');
    expect(r.code).toBe('DLH');
  });
});
```

- [ ] **Step 1.2: Run tests — confirm all fail**

```bash
npm test -- --testPathPattern=airlines
```

Expected: 7 FAIL (`identify` not exported).

- [ ] **Step 1.3: Implement `src/lib/airlines.ts`**

```ts
import { Ident } from '../types';
import airlinesData from '../../assets/airlines.json';

type AirlineEntry = { name: string; iata: string };
const AIRLINES = airlinesData as Record<string, AirlineEntry>;

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
  'HAF',  // Hellenic Air Force
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

export function identify(callsign: string): Ident {
  if (!callsign.trim()) return { kind: 'na', code: null, name: 'N/A' };
  const prefix = callsign.slice(0, 3).toUpperCase();
  if (MILITARY_PREFIXES.has(prefix)) {
    return { kind: 'military', code: prefix, name: 'Military' };
  }
  const entry = AIRLINES[prefix];
  if (entry) {
    return {
      kind: 'airline',
      code: prefix,
      name: entry.name,
      iata: entry.iata || undefined,
    };
  }
  return { kind: 'na', code: prefix, name: 'N/A' };
}
```

- [ ] **Step 1.4: Run tests — confirm all pass**

```bash
npm test -- --testPathPattern=airlines
```

Expected: 7/7 PASS.

- [ ] **Step 1.5: Run all tests — no regressions**

```bash
npm test
```

Expected: 35/35 PASS (28 existing + 7 new).

- [ ] **Step 1.6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 1.7: Commit**

```bash
git add src/lib/airlines.ts __tests__/airlines.test.ts
git commit -m "feat(M4): implement identify() airline/military/na classifier with tests"
```

---

### Task 2: `AirlineTag` SVG component

**Files:**
- Fill in: `src/components/AirlineTag.tsx` (currently stub: `// Milestone 4\nexport {};`)

No automated test — visual SVG component verified on device.

---

- [ ] **Step 2.1: Implement `src/components/AirlineTag.tsx`**

```tsx
import React from 'react';
import {
  G, Image as SvgImage, Polygon, Rect,
  Text as SvgText,
} from 'react-native-svg';
import { Ident } from '../types';

export interface AirlineTagProps {
  ident: Ident;
  callsign: string;
  alt: number;           // baro altitude in metres — displayed as flight level
  x: number;
  y: number;
  heading: number;       // rotates the arrow
  labelRotation: number; // counter-rotates the label to stay upright on the disc
}

function toFL(altMetres: number): string {
  const fl = Math.round((altMetres * 3.28084) / 100);
  return `FL${String(fl).padStart(3, '0')}`;
}

// Static map of logos keyed by 3-letter ICAO designator.
// Add a new entry here whenever a PNG is dropped in assets/logos/.
const LOGO_MAP: Record<string, ReturnType<typeof require>> = {
  DLH: require('../../assets/logos/DLH.png'),
  KLM: require('../../assets/logos/KLM.png'),
  TAP: require('../../assets/logos/TAP.png'),
};

const BADGE_W = 24;
const BADGE_H = 14;
const BADGE_X = 10; // px right of blip centre

export function AirlineTag({
  ident, callsign, alt, x, y, heading, labelRotation,
}: AirlineTagProps) {
  const logo =
    ident.kind === 'airline' && ident.code != null
      ? LOGO_MAP[ident.code]
      : undefined;

  const isMil = ident.kind === 'military';
  const badgeFill   = isMil ? '#312e81' : '#1f2937';
  const badgeStroke = isMil ? '#6d28d9' : '#374151';
  const badgeText   = isMil ? 'MIL' : (ident.code ?? 'N/A');
  const badgeColor  = isMil ? '#c4b5fd' : '#9ca3af';

  return (
    <G transform={`translate(${x}, ${y})`}>

      {/* Arrow — follows aircraft heading, NOT counter-rotated */}
      <G transform={`rotate(${heading})`}>
        <Polygon points="0,-7 -4,4 0,2 4,4" fill="#facc15" />
      </G>

      {/* Label — counter-rotated so text stays upright as disc spins */}
      <G transform={`rotate(${labelRotation})`}>

        {logo ? (
          // Airline logo PNG
          <SvgImage
            x={BADGE_X}
            y={-BADGE_H / 2}
            width={BADGE_W}
            height={BADGE_H}
            href={logo as any}
          />
        ) : (
          // Placeholder badge (grey for unknown/airline-no-logo, purple for military)
          <>
            <Rect
              x={BADGE_X}
              y={-BADGE_H / 2}
              width={BADGE_W}
              height={BADGE_H}
              rx={2}
              fill={badgeFill}
              stroke={badgeStroke}
              strokeWidth={0.5}
            />
            <SvgText
              x={BADGE_X + BADGE_W / 2}
              y={4}
              textAnchor="middle"
              fill={badgeColor}
              fontSize={6}
              fontFamily="monospace"
            >
              {badgeText}
            </SvgText>
          </>
        )}

        {/* Callsign text — 8 px gap after badge */}
        <SvgText
          x={BADGE_X + BADGE_W + 8}
          y={4}
          fill="#facc15"
          fontSize={8}
          fontFamily="monospace"
        >
          {callsign.trim()}
        </SvgText>

        {/* Flight level — below callsign */}
        <SvgText
          x={BADGE_X + BADGE_W + 8}
          y={14}
          fill="#9ca3af"
          fontSize={7}
          fontFamily="monospace"
        >
          {toFL(alt)}
        </SvgText>

      </G>
    </G>
  );
}
```

- [ ] **Step 2.2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.3: Run all tests — no regressions**

```bash
npm test
```

Expected: 35/35 PASS.

- [ ] **Step 2.4: Commit**

```bash
git add src/components/AirlineTag.tsx
git commit -m "feat(M4): implement AirlineTag SVG component with logo/badge + callsign"
```

---

### Task 3: Update `RadarView` to use `AirlineTag`

**Files:**
- Modify: `src/components/RadarView.tsx`

Replace the inline aircraft blip block (lines 107–129) with `<AirlineTag>`. Remove the `Polygon` import (it moves to AirlineTag). Add imports for `AirlineTag` and `identify`.

---

- [ ] **Step 3.1: Update imports in `src/components/RadarView.tsx`**

Change:
```tsx
import Svg, {
  Circle, ClipPath, Defs, G, Line, Path, Polygon,
  Text as SvgText,
} from 'react-native-svg';
import { Aircraft } from '../types';
import { bearingTo, haversineDistance } from '../lib/geo';
```

To:
```tsx
import Svg, {
  Circle, ClipPath, Defs, G, Line, Path,
  Text as SvgText,
} from 'react-native-svg';
import { Aircraft } from '../types';
import { bearingTo, haversineDistance } from '../lib/geo';
import { AirlineTag } from './AirlineTag';
import { identify } from '../lib/airlines';
```

(`Polygon` is removed — it now lives inside `AirlineTag`.)

- [ ] **Step 3.2: Replace the blip rendering block**

Find this block (inside the rotating `<G>` group, under `{/* Aircraft arrows */}`):

```tsx
          {/* Aircraft arrows */}
          <G clipPath="url(#disc)">
            {location && visibleAircraft.map(ac => {
              const { x, y } = projectToSVG(location, ac, rangeM, R);
              return (
                <G key={ac.icao24} transform={`translate(${x}, ${y})`}>
                  <G transform={`rotate(${ac.heading})`}>
                    <Polygon points="0,-7 -4,4 0,2 4,4" fill="#facc15" />
                  </G>
                  <G transform={`rotate(${-discRotation})`}>
                    <SvgText
                      x={8}
                      y={4}
                      fill="#facc15"
                      fontSize={8}
                      fontFamily="monospace"
                    >
                      {ac.callsign.trim()}
                    </SvgText>
                  </G>
                </G>
              );
            })}
          </G>
```

Replace with:

```tsx
          {/* Aircraft blips — AirlineTag owns arrow + label */}
          <G clipPath="url(#disc)">
            {location && visibleAircraft.map(ac => {
              const { x, y } = projectToSVG(location, ac, rangeM, R);
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
            })}
          </G>
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

Expected: 35/35 PASS (the `projectToSVG` tests are unchanged — they don't touch blip rendering).

- [ ] **Step 3.5: Commit**

```bash
git add src/components/RadarView.tsx
git commit -m "feat(M4): wire AirlineTag into RadarView — airline/military/unknown badges on blips"
```

---

### Task 4: Verify on device

- [ ] **Step 4.1: Run on device**

```bash
npx expo run:ios --device
```

(Remember: `node server/proxy.mjs` must be running in a separate terminal.)

- [ ] **Step 4.2: Verify acceptance criteria**

- [ ] Live blips show inline badge + callsign (Option B layout)
- [ ] TAP / KLM / DLH blips show their PNG logo in the badge area
- [ ] Other airline blips show a grey badge with their 3-letter ICAO code
- [ ] Military callsigns (if any) show a purple `MIL` badge
- [ ] Unknown callsigns show a grey `N/A` badge
- [ ] All badges + callsigns stay upright as the disc rotates
- [ ] `npx tsc --noEmit` passes; all 35 tests pass

---

## Self-Review

**Spec coverage:**
- ✅ `identify()`: guard → military → airline lookup → fallback
- ✅ Military prefix Set (24 entries)
- ✅ `airlines.json` imported via `resolveJsonModule`
- ✅ `AirlineTag` props: `ident`, `callsign`, `alt`, `x`, `y`, `heading`, `labelRotation`
- ✅ `toFL(altMetres)` converts metres → `FL###` string (3-digit padded)
- ✅ Flight level displayed below callsign in grey monospace
- ✅ Arrow NOT counter-rotated (heading only)
- ✅ Label group counter-rotated by `labelRotation`
- ✅ Logo PNG via `LOGO_MAP` with `SvgImage href`
- ✅ Placeholder badge: grey for airline/na, purple for military
- ✅ Badge text: ICAO code or `MIL` or `N/A`
- ✅ Callsign text 8 px after badge
- ✅ `RadarView` removes `Polygon` import, adds `AirlineTag` + `identify`
- ✅ 7 unit tests for `identify()`

**Placeholder scan:** None found.

**Type consistency:**
- `identify()` returns `Ident` from `src/types.ts` ✓
- `AirlineTag` consumes `ident: Ident` and `heading: number` — matches what RadarView passes (`ac.heading`) ✓
- `labelRotation={-discRotation}` — in RadarView, `discRotation = azimuth !== null ? -azimuth : 0`, so `labelRotation = azimuth ?? 0` — same pattern as before ✓
- `LOGO_MAP` keys (`DLH`, `KLM`, `TAP`) match filenames in `assets/logos/` ✓
