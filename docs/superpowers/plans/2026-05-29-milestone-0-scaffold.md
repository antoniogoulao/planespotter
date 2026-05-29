# Milestone 0 — Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Expo SDK 56 Router app with core packages, shared types, i18n wiring, and location + camera permission requests so the home screen runs on a physical device.

**Architecture:** Single Expo Router stack (no tabs in M0); root layout calls `initI18n()` and requests permissions before rendering; home screen shows Radar/AR nav buttons + permission badge per permission.

**Tech Stack:** Expo SDK 56, React Native 0.85, TypeScript, Expo Router, expo-location, expo-camera, expo-localization, i18next, react-i18next, @react-native-async-storage/async-storage.

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Scaffold | `app/_layout.tsx` | Root stack layout, init i18n, request permissions |
| Scaffold | `app/index.tsx` | Home screen: Radar/AR nav buttons + permission status |
| Create | `app/radar.tsx` | Placeholder (M1 content) |
| Create | `app/ar.tsx` | Placeholder (M6 content) |
| Create | `src/types.ts` | All shared domain types |
| Create | `src/i18n/index.ts` | i18next init, locale detection, persistence |
| Create | `src/i18n/locales/en-US.json` | Complete key set (source of truth) |
| Create | `src/i18n/locales/en-GB.json` | Thin override (British spellings) |
| Create | `src/i18n/locales/fr-FR.json` | French |
| Create | `src/i18n/locales/pt-PT.json` | European Portuguese |
| Create | `src/i18n/locales/pt-BR.json` | Brazilian Portuguese |
| Create | `src/i18n/locales/es-ES.json` | Spanish |
| Create | `src/i18n/locales/de-DE.json` | German |
| Create | `src/i18n/locales/it-IT.json` | Italian |
| Create | `src/lib/format.ts` | Locale-aware number/altitude/speed/time formatters |
| Create | `src/hooks/useLocation.ts` | Placeholder (M1 fills in) |
| Create | `src/hooks/useDeviceOrientation.ts` | Placeholder (M1 fills in) |
| Create | `src/hooks/useAircraft.ts` | Placeholder (M3 fills in) |
| Create | `src/api/opensky.ts` | Placeholder (M3 fills in) |
| Create | `src/api/adsbdb.ts` | Placeholder (M5 fills in) |
| Create | `src/lib/geo.ts` | Placeholder (M1 fills in) |
| Create | `src/lib/projection.ts` | Placeholder (M6 fills in) |
| Create | `src/lib/airlines.ts` | Placeholder (M4 fills in) |
| Create | `src/components/DebugReadout.tsx` | Placeholder (M1 fills in) |
| Create | `src/components/PlaneSprite.tsx` | Placeholder (M6 fills in) |
| Create | `src/components/AirlineTag.tsx` | Placeholder (M4 fills in) |
| Create | `src/components/PlaneMarker.tsx` | Placeholder (M6 fills in) |
| Create | `src/components/RadarView.tsx` | Placeholder (M2 fills in) |
| Create | `src/components/AROverlay.tsx` | Placeholder (M6 fills in) |
| Create | `src/components/LanguagePicker.tsx` | Placeholder (M7 fills in) |
| Create | `assets/airlines.json` | Generated airline data (M4 generates this) |
| Create | `assets/logos/` | Logo directory (M4 populates) |
| Create | `scripts/build-airlines.mjs` | Placeholder script (M4 fills in) |

---

### Task 1: Scaffold the Expo app in the current directory

**Files:**
- Modify: `package.json` (created by scaffold)
- Modify: `app/_layout.tsx` (reset from scaffold default)
- Modify: `app/index.tsx` (reset from scaffold default)

- [ ] **Step 1.1: Scaffold the app**

Run from `/Users/antoniogoulao/git/planespotter`:
```bash
npx create-expo-app@latest . --template blank-typescript
```
When prompted about the existing directory, confirm yes.

Expected: `app/`, `assets/`, `package.json`, `tsconfig.json`, `app.json` are created.

- [ ] **Step 1.2: Verify Expo Router is included**

```bash
cat package.json | grep expo-router
```

If `expo-router` is NOT listed, install it:
```bash
npx expo install expo-router
```

- [ ] **Step 1.3: Ensure app.json uses Expo Router**

Open `app.json` and ensure it contains:
```json
{
  "expo": {
    "scheme": "planespotter",
    "web": { "bundler": "metro" }
  }
}
```
Add `scheme` and `web.bundler` if missing (required by Expo Router).

- [ ] **Step 1.4: Ensure package.json main entry points to expo-router**

```json
"main": "expo-router/entry"
```
Replace whatever `main` is set to with the above.

- [ ] **Step 1.5: Commit scaffold**

```bash
git add -A
git commit -m "chore: scaffold Expo SDK 56 Router app"
```

---

### Task 2: Install core packages

**Files:**
- Modify: `package.json` (deps added)

- [ ] **Step 2.1: Install Expo-managed packages**

```bash
npx expo install expo-sensors expo-location expo-camera expo-image react-native-svg expo-localization @react-native-async-storage/async-storage
```

Expected: all packages added to `package.json`, no peer-dep errors.

- [ ] **Step 2.2: Install JS packages**

```bash
npm install i18next react-i18next
```

- [ ] **Step 2.3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install core packages for planespotter"
```

---

### Task 3: Create directory structure and placeholder files

**Files:**
- Create: all `src/` subdirectories and placeholder files

- [ ] **Step 3.1: Create directories**

```bash
mkdir -p src/api src/hooks src/lib src/i18n/locales src/components src/detection assets/logos scripts
```

- [ ] **Step 3.2: Create placeholder hooks**

`src/hooks/useLocation.ts`:
```ts
// Milestone 1
export {};
```

`src/hooks/useDeviceOrientation.ts`:
```ts
// Milestone 1
export {};
```

`src/hooks/useAircraft.ts`:
```ts
// Milestone 3
export {};
```

- [ ] **Step 3.3: Create placeholder API files**

`src/api/opensky.ts`:
```ts
// Milestone 3
export {};
```

`src/api/adsbdb.ts`:
```ts
// Milestone 5
export {};
```

- [ ] **Step 3.4: Create placeholder lib files**

`src/lib/geo.ts`:
```ts
// Milestone 1
export {};
```

`src/lib/projection.ts`:
```ts
// Milestone 6
export {};
```

`src/lib/airlines.ts`:
```ts
// Milestone 4
export {};
```

- [ ] **Step 3.5: Create placeholder components**

`src/components/DebugReadout.tsx`:
```tsx
// Milestone 1
export {};
```

`src/components/PlaneSprite.tsx`:
```tsx
// Milestone 6
export {};
```

`src/components/AirlineTag.tsx`:
```tsx
// Milestone 4
export {};
```

`src/components/PlaneMarker.tsx`:
```tsx
// Milestone 6
export {};
```

`src/components/RadarView.tsx`:
```tsx
// Milestone 2
export {};
```

`src/components/AROverlay.tsx`:
```tsx
// Milestone 6
export {};
```

`src/components/LanguagePicker.tsx`:
```tsx
// Milestone 7
export {};
```

- [ ] **Step 3.6: Create placeholder assets**

`assets/airlines.json`:
```json
{}
```

`scripts/build-airlines.mjs`:
```js
// Milestone 4
```

- [ ] **Step 3.7: Commit structure**

```bash
git add src/ assets/airlines.json assets/logos/.gitkeep scripts/
git commit -m "chore: create src directory structure and placeholder files"
```

---

### Task 4: Create `src/types.ts`

**Files:**
- Create: `src/types.ts`

- [ ] **Step 4.1: Write types**

`src/types.ts`:
```ts
export type IdentKind = 'airline' | 'military' | 'na';

export interface Aircraft {
  icao24: string;
  callsign: string;
  lat: number; lon: number; alt: number; // alt in metres
  velocity: number;     // m/s
  heading: number;      // true track, degrees
  verticalRate: number; // m/s
  lastUpdate: number;   // ms epoch, for dead reckoning
}

export interface Ident { kind: IdentKind; code: string | null; name: string; iata?: string }
export interface Airport { iata: string; icao: string; name: string; city: string }
export interface Route { origin: Airport; destination: Airport }
export interface Geo { lat: number; lon: number; alt?: number }
export interface Orientation { azimuth: number; elevation: number }

export interface PlaneView {
  aircraft: Aircraft;
  ident: Ident;
  route: Route | null;
  screen: { x: number; y: number };
  source: 'detected' | 'projected';
}
```

- [ ] **Step 4.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared domain types"
```

---

### Task 5: Create i18n locale files

**Files:**
- Create: `src/i18n/locales/en-US.json` (complete key set)
- Create: `src/i18n/locales/en-GB.json` (thin override)
- Create: `src/i18n/locales/fr-FR.json`
- Create: `src/i18n/locales/pt-PT.json`
- Create: `src/i18n/locales/pt-BR.json`
- Create: `src/i18n/locales/es-ES.json`
- Create: `src/i18n/locales/de-DE.json`
- Create: `src/i18n/locales/it-IT.json`

- [ ] **Step 5.1: Write `src/i18n/locales/en-US.json`**

This is the source-of-truth key set. All other files must mirror these keys (or be partial).

```json
{
  "home": {
    "title": "PlaneSpotter",
    "radar": "Radar",
    "ar": "AR",
    "permissions": {
      "heading": "Permissions",
      "location": "Location",
      "camera": "Camera",
      "granted": "Granted",
      "denied": "Denied",
      "pending": "Pending",
      "requestAll": "Grant Permissions"
    }
  },
  "radar": {
    "title": "Radar"
  },
  "ar": {
    "title": "AR View"
  },
  "settings": {
    "title": "Settings",
    "language": "Language",
    "units": "Units",
    "metric": "Metric",
    "imperial": "Imperial"
  },
  "units": {
    "ft": "ft",
    "m": "m",
    "kn": "kn",
    "kmh": "km/h"
  },
  "detail": {
    "altitude": "Altitude",
    "speed": "Speed",
    "heading": "Heading",
    "callsign": "Callsign",
    "route": "Route",
    "noRoute": "No route"
  }
}
```

- [ ] **Step 5.2: Write `src/i18n/locales/en-GB.json`**

Only keys that differ from en-US:
```json
{
  "home": {
    "title": "PlaneSpotter",
    "radar": "Radar",
    "ar": "AR"
  },
  "ar": {
    "title": "AR View"
  },
  "units": {
    "ft": "ft",
    "m": "m",
    "kn": "kn",
    "kmh": "km/h"
  }
}
```

- [ ] **Step 5.3: Write `src/i18n/locales/fr-FR.json`**

```json
{
  "home": {
    "title": "PlaneSpotter",
    "radar": "Radar",
    "ar": "RA",
    "permissions": {
      "heading": "Autorisations",
      "location": "Localisation",
      "camera": "Caméra",
      "granted": "Accordé",
      "denied": "Refusé",
      "pending": "En attente",
      "requestAll": "Accorder les autorisations"
    }
  },
  "radar": {
    "title": "Radar"
  },
  "ar": {
    "title": "Vue RA"
  },
  "settings": {
    "title": "Paramètres",
    "language": "Langue",
    "units": "Unités",
    "metric": "Métrique",
    "imperial": "Impérial"
  },
  "units": {
    "ft": "ft",
    "m": "m",
    "kn": "nd",
    "kmh": "km/h"
  },
  "detail": {
    "altitude": "Altitude",
    "speed": "Vitesse",
    "heading": "Cap",
    "callsign": "Indicatif",
    "route": "Route",
    "noRoute": "Pas de route"
  }
}
```

- [ ] **Step 5.4: Write `src/i18n/locales/pt-PT.json`**

```json
{
  "home": {
    "title": "PlaneSpotter",
    "radar": "Radar",
    "ar": "RA",
    "permissions": {
      "heading": "Permissões",
      "location": "Localização",
      "camera": "Câmara",
      "granted": "Concedido",
      "denied": "Negado",
      "pending": "Pendente",
      "requestAll": "Conceder permissões"
    }
  },
  "radar": {
    "title": "Radar"
  },
  "ar": {
    "title": "Vista RA"
  },
  "settings": {
    "title": "Definições",
    "language": "Idioma",
    "units": "Unidades",
    "metric": "Métrico",
    "imperial": "Imperial"
  },
  "units": {
    "ft": "ft",
    "m": "m",
    "kn": "kn",
    "kmh": "km/h"
  },
  "detail": {
    "altitude": "Altitude",
    "speed": "Velocidade",
    "heading": "Rumo",
    "callsign": "Indicativo",
    "route": "Rota",
    "noRoute": "Sem rota"
  }
}
```

- [ ] **Step 5.5: Write `src/i18n/locales/pt-BR.json`**

```json
{
  "home": {
    "title": "PlaneSpotter",
    "radar": "Radar",
    "ar": "RA",
    "permissions": {
      "heading": "Permissões",
      "location": "Localização",
      "camera": "Câmera",
      "granted": "Concedido",
      "denied": "Negado",
      "pending": "Pendente",
      "requestAll": "Conceder permissões"
    }
  },
  "radar": {
    "title": "Radar"
  },
  "ar": {
    "title": "Vista RA"
  },
  "settings": {
    "title": "Configurações",
    "language": "Idioma",
    "units": "Unidades",
    "metric": "Métrico",
    "imperial": "Imperial"
  },
  "units": {
    "ft": "ft",
    "m": "m",
    "kn": "kn",
    "kmh": "km/h"
  },
  "detail": {
    "altitude": "Altitude",
    "speed": "Velocidade",
    "heading": "Rumo",
    "callsign": "Indicativo",
    "route": "Rota",
    "noRoute": "Sem rota"
  }
}
```

- [ ] **Step 5.6: Write `src/i18n/locales/es-ES.json`**

```json
{
  "home": {
    "title": "PlaneSpotter",
    "radar": "Radar",
    "ar": "RA",
    "permissions": {
      "heading": "Permisos",
      "location": "Ubicación",
      "camera": "Cámara",
      "granted": "Concedido",
      "denied": "Denegado",
      "pending": "Pendiente",
      "requestAll": "Conceder permisos"
    }
  },
  "radar": {
    "title": "Radar"
  },
  "ar": {
    "title": "Vista RA"
  },
  "settings": {
    "title": "Ajustes",
    "language": "Idioma",
    "units": "Unidades",
    "metric": "Métrico",
    "imperial": "Imperial"
  },
  "units": {
    "ft": "ft",
    "m": "m",
    "kn": "kn",
    "kmh": "km/h"
  },
  "detail": {
    "altitude": "Altitud",
    "speed": "Velocidad",
    "heading": "Rumbo",
    "callsign": "Indicativo",
    "route": "Ruta",
    "noRoute": "Sin ruta"
  }
}
```

- [ ] **Step 5.7: Write `src/i18n/locales/de-DE.json`**

```json
{
  "home": {
    "title": "PlaneSpotter",
    "radar": "Radar",
    "ar": "AR",
    "permissions": {
      "heading": "Berechtigungen",
      "location": "Standort",
      "camera": "Kamera",
      "granted": "Erteilt",
      "denied": "Verweigert",
      "pending": "Ausstehend",
      "requestAll": "Berechtigungen erteilen"
    }
  },
  "radar": {
    "title": "Radar"
  },
  "ar": {
    "title": "AR-Ansicht"
  },
  "settings": {
    "title": "Einstellungen",
    "language": "Sprache",
    "units": "Einheiten",
    "metric": "Metrisch",
    "imperial": "Imperial"
  },
  "units": {
    "ft": "ft",
    "m": "m",
    "kn": "kn",
    "kmh": "km/h"
  },
  "detail": {
    "altitude": "Höhe",
    "speed": "Geschwindigkeit",
    "heading": "Kurs",
    "callsign": "Rufzeichen",
    "route": "Route",
    "noRoute": "Keine Route"
  }
}
```

- [ ] **Step 5.8: Write `src/i18n/locales/it-IT.json`**

```json
{
  "home": {
    "title": "PlaneSpotter",
    "radar": "Radar",
    "ar": "RA",
    "permissions": {
      "heading": "Autorizzazioni",
      "location": "Posizione",
      "camera": "Fotocamera",
      "granted": "Concesso",
      "denied": "Negato",
      "pending": "In attesa",
      "requestAll": "Concedi autorizzazioni"
    }
  },
  "radar": {
    "title": "Radar"
  },
  "ar": {
    "title": "Vista RA"
  },
  "settings": {
    "title": "Impostazioni",
    "language": "Lingua",
    "units": "Unità",
    "metric": "Metrico",
    "imperial": "Imperiale"
  },
  "units": {
    "ft": "ft",
    "m": "m",
    "kn": "kn",
    "kmh": "km/h"
  },
  "detail": {
    "altitude": "Altitudine",
    "speed": "Velocità",
    "heading": "Rotta",
    "callsign": "Indicativo",
    "route": "Rotta",
    "noRoute": "Nessuna rotta"
  }
}
```

- [ ] **Step 5.9: Commit locale files**

```bash
git add src/i18n/
git commit -m "feat: add i18n locale files for all 8 supported locales"
```

---

### Task 6: Create `src/i18n/index.ts`

**Files:**
- Create: `src/i18n/index.ts`

- [ ] **Step 6.1: Write the i18n init module**

`src/i18n/index.ts`:
```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import enUS from './locales/en-US.json';
import enGB from './locales/en-GB.json';
import frFR from './locales/fr-FR.json';
import ptPT from './locales/pt-PT.json';
import ptBR from './locales/pt-BR.json';
import esES from './locales/es-ES.json';
import deDE from './locales/de-DE.json';
import itIT from './locales/it-IT.json';

const resources = {
  'en-US': { translation: enUS }, 'en-GB': { translation: enGB },
  'fr-FR': { translation: frFR }, 'pt-PT': { translation: ptPT },
  'pt-BR': { translation: ptBR }, 'es-ES': { translation: esES },
  'de-DE': { translation: deDE }, 'it-IT': { translation: itIT },
};
export const SUPPORTED = Object.keys(resources);
const STORAGE_KEY = 'lang';

function pickLocale(stored?: string | null): string {
  if (stored && SUPPORTED.includes(stored)) return stored;
  for (const { languageTag } of Localization.getLocales()) {
    if (SUPPORTED.includes(languageTag)) return languageTag;
    const base = languageTag.split('-')[0];
    const region = SUPPORTED.find((s) => s.startsWith(base + '-'));
    if (region) return region;
  }
  return 'en-US';
}

export async function initI18n() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  await i18n.use(initReactI18next).init({
    resources,
    lng: pickLocale(stored),
    supportedLngs: SUPPORTED,
    fallbackLng: { 'en-GB': ['en-US'], 'pt-BR': ['pt-PT'], 'pt-PT': ['pt-BR'], default: ['en-US'] },
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return i18n;
}

export async function setLanguage(tag: string) {
  await AsyncStorage.setItem(STORAGE_KEY, tag);
  await i18n.changeLanguage(tag);
}
export default i18n;
```

- [ ] **Step 6.2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6.3: Commit**

```bash
git add src/i18n/index.ts
git commit -m "feat: add i18n init module with locale detection and persistence"
```

---

### Task 7: Create `src/lib/format.ts`

**Files:**
- Create: `src/lib/format.ts`

- [ ] **Step 7.1: Write format.ts**

`src/lib/format.ts`:
```ts
import i18n from '../i18n';
export type Units = 'metric' | 'imperial';
const loc = () => i18n.language || 'en-US';

export const formatNumber = (n: number, o?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(loc(), o).format(n);

export function formatAltitude(metres: number, units: Units) {
  return units === 'imperial'
    ? `${formatNumber(Math.round(metres * 3.28084))} ${i18n.t('units.ft')}`
    : `${formatNumber(Math.round(metres))} ${i18n.t('units.m')}`;
}

export function formatSpeed(ms: number, units: Units) {
  return units === 'imperial'
    ? `${formatNumber(Math.round(ms * 1.94384))} ${i18n.t('units.kn')}`
    : `${formatNumber(Math.round(ms * 3.6))} ${i18n.t('units.kmh')}`;
}

export const formatTime = (ms: number) =>
  new Intl.DateTimeFormat(loc(), { hour: '2-digit', minute: '2-digit' }).format(ms);
```

- [ ] **Step 7.2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7.3: Commit**

```bash
git add src/lib/format.ts
git commit -m "feat: add locale-aware number/altitude/speed/time formatters"
```

---

### Task 8: Wire root layout with i18n + permissions

**Files:**
- Modify: `app/_layout.tsx`

The root layout must:
1. Call `initI18n()` before first render (keep a `ready` flag)
2. Use Expo Router's `<Stack>` for navigation
3. Show a blank splash while i18n initialises

- [ ] **Step 8.1: Write `app/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { initI18n } from '../src/i18n';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  if (!ready) return <View style={{ flex: 1 }} />;

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'PlaneSpotter' }} />
      <Stack.Screen name="radar" options={{ title: 'Radar' }} />
      <Stack.Screen name="ar" options={{ title: 'AR' }} />
    </Stack>
  );
}
```

- [ ] **Step 8.2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8.3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: wire root layout with i18n init"
```

---

### Task 9: Build home screen with permission status

**Files:**
- Modify: `app/index.tsx`
- Modify: `app/radar.tsx`
- Modify: `app/ar.tsx`

The home screen must:
- Show Radar and AR navigation buttons
- Show permission status for location + camera (Granted / Denied / Pending)
- Request permissions when "Grant Permissions" is tapped
- All labels come from i18n `t()`

- [ ] **Step 9.1: Write `app/index.tsx`**

```tsx
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

type PermStatus = 'granted' | 'denied' | 'pending';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [locationStatus, setLocationStatus] = useState<PermStatus>('pending');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setLocationStatus(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'pending');
    });
  }, []);

  const cameraStatus: PermStatus = cameraPermission?.granted
    ? 'granted'
    : cameraPermission?.canAskAgain === false
    ? 'denied'
    : 'pending';

  async function requestAll() {
    const loc = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(loc.status === 'granted' ? 'granted' : loc.status === 'denied' ? 'denied' : 'pending');
    await requestCameraPermission();
  }

  const statusColor = (s: PermStatus) =>
    s === 'granted' ? '#22c55e' : s === 'denied' ? '#ef4444' : '#f59e0b';

  const statusLabel = (s: PermStatus) =>
    s === 'granted' ? t('home.permissions.granted')
    : s === 'denied' ? t('home.permissions.denied')
    : t('home.permissions.pending');

  const allGranted = locationStatus === 'granted' && cameraStatus === 'granted';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.title')}</Text>

      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/radar')}>
          <Text style={styles.navBtnText}>{t('home.radar')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/ar')}>
          <Text style={styles.navBtnText}>{t('home.ar')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.perms}>
        <Text style={styles.permsHeading}>{t('home.permissions.heading')}</Text>
        <View style={styles.permRow}>
          <Text style={styles.permLabel}>{t('home.permissions.location')}</Text>
          <Text style={[styles.permStatus, { color: statusColor(locationStatus) }]}>
            {statusLabel(locationStatus)}
          </Text>
        </View>
        <View style={styles.permRow}>
          <Text style={styles.permLabel}>{t('home.permissions.camera')}</Text>
          <Text style={[styles.permStatus, { color: statusColor(cameraStatus) }]}>
            {statusLabel(cameraStatus)}
          </Text>
        </View>
        {!allGranted && (
          <TouchableOpacity style={styles.grantBtn} onPress={requestAll}>
            <Text style={styles.grantBtnText}>{t('home.permissions.requestAll')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 32 },
  title: { fontSize: 32, fontWeight: '700' },
  nav: { flexDirection: 'row', gap: 16 },
  navBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 16 },
  navBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  perms: { width: '100%', gap: 12 },
  permsHeading: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  permRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  permLabel: { fontSize: 15 },
  permStatus: { fontSize: 15, fontWeight: '500' },
  grantBtn: { backgroundColor: '#10b981', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  grantBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 9.2: Write `app/radar.tsx` placeholder**

```tsx
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

export default function RadarScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('radar.title')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 24, fontWeight: '600' },
});
```

- [ ] **Step 9.3: Write `app/ar.tsx` placeholder**

```tsx
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

export default function ARScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('ar.title')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 24, fontWeight: '600' },
});
```

- [ ] **Step 9.4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9.5: Commit**

```bash
git add app/index.tsx app/radar.tsx app/ar.tsx
git commit -m "feat(M0): home screen with Radar/AR nav and permission status"
```

---

### Task 10: Build dev client and test on device

- [ ] **Step 10.1: Add permissions to app.json**

Open `app.json` and add to the `expo` object:
```json
"ios": {
  "infoPlist": {
    "NSLocationWhenInUseUsageDescription": "PlaneSpotter needs your location to find nearby aircraft.",
    "NSCameraUsageDescription": "PlaneSpotter uses the camera to overlay aircraft on the live feed."
  }
},
"android": {
  "permissions": [
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.CAMERA"
  ]
}
```

- [ ] **Step 10.2: Run prebuild to generate native projects**

```bash
npx expo prebuild --clean
```

Expected: `ios/` and `android/` directories created.

- [ ] **Step 10.3: Build and run on device**

For iOS:
```bash
npx expo run:ios --device
```

For Android:
```bash
npx expo run:android --device
```

Expected: app launches on device, home screen shows "PlaneSpotter" title, Radar and AR buttons, permission status rows.

- [ ] **Step 10.4: Verify acceptance criteria**

- [ ] Dev build installs and opens on device
- [ ] Home screen shows Radar button and AR button
- [ ] Home screen shows Location and Camera permission rows with correct status
- [ ] Tapping "Grant Permissions" triggers iOS/Android permission dialogs
- [ ] After granting, rows show "Granted" in green
- [ ] Labels are in device locale (e.g. Portuguese device shows "Radar" / "RA", "Localização", etc.)
- [ ] Tapping Radar navigates to Radar placeholder screen
- [ ] Tapping AR navigates to AR placeholder screen

- [ ] **Step 10.5: Final commit**

```bash
git add app.json ios/ android/
git commit -m "chore(M0): add native permission config and prebuild artifacts"
```

---

## Self-Review

**Spec coverage:**
- ✅ Expo SDK 56 + Expo Router scaffolded
- ✅ All packages from spec installed (`expo-sensors`, `expo-location`, `expo-camera`, `expo-image`, `react-native-svg`, `expo-localization`, `@react-native-async-storage/async-storage`, `i18next`, `react-i18next`)
- ✅ `src/types.ts` with all shared domain types
- ✅ `src/i18n/index.ts` + all 8 locale files
- ✅ `initI18n()` called in root layout before render
- ✅ Location + camera permissions requested and displayed
- ✅ All UI labels go through `t()` from M0
- ✅ Device locale auto-selected by `pickLocale()`
- ✅ Acceptance: "dev build runs on a device; home shows Radar/AR buttons + permission status, with all labels coming from i18n"
- ✅ Placeholder files for all future milestones created
- ✅ `format.ts` in place for M7 to fill out

**Placeholder scan:** No TBDs or missing code blocks.

**Type consistency:** `Units` exported from `format.ts`, used consistently. All `src/types.ts` types are self-contained and not cross-referenced in M0 screens (they'll be needed from M2 onward).
