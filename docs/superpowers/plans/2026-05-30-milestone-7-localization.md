# Milestone 7 — Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the 5 hardcoded strings added in M1–M6 with `t()`, add their translations to all 8 locale files, implement the `LanguagePicker` component, and add a Settings screen reachable via a gear icon on the home screen.

**Architecture:** The i18n infrastructure (initI18n, setLanguage, SUPPORTED, 8 locale files) was built in M0 — nothing in that layer changes. New keys are added to each locale file. `LanguagePicker` uses `useTranslation()` for the current language and `setLanguage()` to switch. The Settings screen is a new Expo Router route registered in `_layout.tsx`.

**Tech Stack:** i18next, react-i18next, expo-router (Stack), TypeScript strict.

---

## File map

| Action | Path | Change |
|--------|------|--------|
| Modify | `src/i18n/locales/en-US.json` | Add 5 new keys |
| Modify | `src/i18n/locales/en-GB.json` | Add 5 new keys (same English values) |
| Modify | `src/i18n/locales/fr-FR.json` | Add 5 French translations |
| Modify | `src/i18n/locales/pt-PT.json` | Add 5 pt-PT translations |
| Modify | `src/i18n/locales/pt-BR.json` | Add 5 pt-BR translations |
| Modify | `src/i18n/locales/es-ES.json` | Add 5 es-ES translations |
| Modify | `src/i18n/locales/de-DE.json` | Add 5 de-DE translations |
| Modify | `src/i18n/locales/it-IT.json` | Add 5 it-IT translations |
| Fill in | `src/components/LanguagePicker.tsx` | Language list with native names + checkmarks |
| Create | `app/settings.tsx` | Settings screen: language heading + LanguagePicker |
| Modify | `app/_layout.tsx` | Register /settings, gear icon on home header |
| Modify | `app/ar.tsx` | Replace 3 hardcoded camera strings with `t()` |
| Modify | `src/components/RadarView.tsx` | Replace `'Locating…'` with `t()` |
| Modify | `src/hooks/useLocation.ts` | Replace hardcoded error with `i18n.t()` |

---

## Context

`SUPPORTED` and `setLanguage(tag: string)` are already exported from `src/i18n/index.ts`.

`i18n` (default export of `src/i18n/index.ts`) exposes `.t()` for non-component code.

Current locale files have: `home`, `radar` (title only), `ar` (title only), `settings`, `units`, `detail` sections. The new keys extend `radar`, `ar`, and add a new `errors` section.

---

### Task 1: Add new i18n keys to all 8 locale files

**Files:** All 8 locale JSON files in `src/i18n/locales/`

Each file gets:
- 3 keys added to its `ar` section: `permissionRequired`, `permissionDenied`, `grantPermission`
- 1 key added to its `radar` section: `locating`
- A new top-level `errors` section with 1 key: `locationPermission`

---

- [ ] **Step 1.1: Update `src/i18n/locales/en-US.json`**

Add to the `ar` section (after `"title": "AR View"`):
```json
    "permissionRequired": "Camera permission required for AR view.",
    "permissionDenied": "Enable camera access in Settings to use AR view.",
    "grantPermission": "Grant Permission"
```

Add to the `radar` section (after `"title": "Radar"`):
```json
    "locating": "Locating…"
```

Add a new top-level `errors` section before the closing `}`:
```json
  "errors": {
    "locationPermission": "Location permission not granted"
  }
```

- [ ] **Step 1.2: Update `src/i18n/locales/en-GB.json`**

Add to `ar` section:
```json
    "permissionRequired": "Camera permission required for AR view.",
    "permissionDenied": "Enable camera access in Settings to use AR view.",
    "grantPermission": "Grant Permission"
```
Add to `radar` section:
```json
    "locating": "Locating…"
```
Add new `errors` section:
```json
  "errors": {
    "locationPermission": "Location permission not granted"
  }
```

- [ ] **Step 1.3: Update `src/i18n/locales/fr-FR.json`**

Add to `ar` section:
```json
    "permissionRequired": "Autorisation de caméra requise pour la vue RA.",
    "permissionDenied": "Activez l'accès à la caméra dans les réglages pour utiliser la vue RA.",
    "grantPermission": "Accorder l'autorisation"
```
Add to `radar` section:
```json
    "locating": "Localisation…"
```
Add new `errors` section:
```json
  "errors": {
    "locationPermission": "Autorisation de localisation refusée"
  }
```

- [ ] **Step 1.4: Update `src/i18n/locales/pt-PT.json`**

Add to `ar` section:
```json
    "permissionRequired": "Permissão de câmara necessária para a vista RA.",
    "permissionDenied": "Ative o acesso à câmara nas definições para usar a vista RA.",
    "grantPermission": "Conceder permissão"
```
Add to `radar` section:
```json
    "locating": "A localizar…"
```
Add new `errors` section:
```json
  "errors": {
    "locationPermission": "Permissão de localização não concedida"
  }
```

- [ ] **Step 1.5: Update `src/i18n/locales/pt-BR.json`**

Add to `ar` section:
```json
    "permissionRequired": "Permissão de câmera necessária para a vista RA.",
    "permissionDenied": "Ative o acesso à câmera nas configurações para usar a vista RA.",
    "grantPermission": "Conceder permissão"
```
Add to `radar` section:
```json
    "locating": "Localizando…"
```
Add new `errors` section:
```json
  "errors": {
    "locationPermission": "Permissão de localização não concedida"
  }
```

- [ ] **Step 1.6: Update `src/i18n/locales/es-ES.json`**

Add to `ar` section:
```json
    "permissionRequired": "Permiso de cámara requerido para la vista RA.",
    "permissionDenied": "Active el acceso a la cámara en Ajustes para usar la vista RA.",
    "grantPermission": "Conceder permiso"
```
Add to `radar` section:
```json
    "locating": "Localizando…"
```
Add new `errors` section:
```json
  "errors": {
    "locationPermission": "Permiso de ubicación no concedido"
  }
```

- [ ] **Step 1.7: Update `src/i18n/locales/de-DE.json`**

Add to `ar` section:
```json
    "permissionRequired": "Kameraberechtigung für die AR-Ansicht erforderlich.",
    "permissionDenied": "Aktivieren Sie den Kamerazugriff in den Einstellungen für die AR-Ansicht.",
    "grantPermission": "Berechtigung erteilen"
```
Add to `radar` section:
```json
    "locating": "Lokalisiere…"
```
Add new `errors` section:
```json
  "errors": {
    "locationPermission": "Standortberechtigung nicht erteilt"
  }
```

- [ ] **Step 1.8: Update `src/i18n/locales/it-IT.json`**

Add to `ar` section:
```json
    "permissionRequired": "Autorizzazione fotocamera richiesta per la vista RA.",
    "permissionDenied": "Abilita l'accesso alla fotocamera nelle impostazioni per usare la vista RA.",
    "grantPermission": "Concedi autorizzazione"
```
Add to `radar` section:
```json
    "locating": "Localizzazione…"
```
Add new `errors` section:
```json
  "errors": {
    "locationPermission": "Autorizzazione posizione non concessa"
  }
```

- [ ] **Step 1.9: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors (TypeScript validates JSON shape via resolveJsonModule).

- [ ] **Step 1.10: Run all tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 1.11: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat(M7): add AR permission, radar locating, and location error i18n keys to all 8 locales"
```

---

### Task 2: Implement `LanguagePicker`

**Files:**
- Fill in: `src/components/LanguagePicker.tsx` (stub: `// Milestone 7\nexport {};`)

---

- [ ] **Step 2.1: Implement `src/components/LanguagePicker.tsx`**

```tsx
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SUPPORTED, setLanguage } from '../i18n';

const NAMES: Record<string, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'fr-FR': 'Français',
  'pt-PT': 'Português (Portugal)',
  'pt-BR': 'Português (Brasil)',
  'es-ES': 'Español',
  'de-DE': 'Deutsch',
  'it-IT': 'Italiano',
};

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <FlatList
      data={SUPPORTED}
      keyExtractor={(tag) => tag}
      renderItem={({ item: tag }) => (
        <Pressable
          style={styles.row}
          onPress={() => void setLanguage(tag)}
        >
          <Text style={styles.name}>{NAMES[tag] ?? tag}</Text>
          {current === tag && <Text style={styles.check}>✓</Text>}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#374151',
  },
  name:  { color: '#f3f4f6', fontSize: 16 },
  check: { color: '#4ade80', fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 2.2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.3: Run all tests**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 2.4: Commit**

```bash
git add src/components/LanguagePicker.tsx
git commit -m "feat(M7): implement LanguagePicker with native language names"
```

---

### Task 3: Settings screen + layout wiring

**Files:**
- Create: `app/settings.tsx`
- Modify: `app/_layout.tsx`

---

- [ ] **Step 3.1: Create `app/settings.tsx`**

```tsx
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguagePicker } from '../src/components/LanguagePicker';

export default function SettingsScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('settings.language').toUpperCase()}</Text>
      <LanguagePicker />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  heading: {
    color: '#9ca3af',
    fontSize: 13,
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
```

- [ ] **Step 3.2: Update `app/_layout.tsx`**

Replace the entire file with:

```tsx
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { initI18n } from '../src/i18n';
import { DebugReadout } from '../src/components/DebugReadout';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  if (!ready) return <View style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: t('home.title'),
            headerRight: () => (
              <Pressable
                onPress={() => router.push('/settings')}
                style={{ marginRight: 12 }}
              >
                <Text style={{ fontSize: 22 }}>⚙️</Text>
              </Pressable>
            ),
          }}
        />
        <Stack.Screen name="radar"    options={{ title: t('radar.title') }} />
        <Stack.Screen name="ar"       options={{ title: t('ar.title') }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
      </Stack>
      {__DEV__ && (
        <>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => setShowDebug((v) => !v)}
          >
            <Text style={styles.chipText}>D</Text>
          </TouchableOpacity>
          {showDebug && <DebugReadout />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
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
git add app/settings.tsx app/_layout.tsx
git commit -m "feat(M7): add Settings screen with LanguagePicker; gear icon on home header"
```

---

### Task 4: Replace hardcoded strings with `t()` calls

**Files:**
- Modify: `app/ar.tsx`
- Modify: `src/components/RadarView.tsx`
- Modify: `src/hooks/useLocation.ts`

---

- [ ] **Step 4.1: Update `app/ar.tsx`**

Add `useTranslation` to the imports:
```tsx
import { useTranslation } from 'react-i18next';
```

Add `const { t } = useTranslation();` as the first line inside `ARScreen` (before the existing hook calls).

Replace the three hardcoded strings:

| Before | After |
|---|---|
| `'Camera permission required for AR view.'` | `t('ar.permissionRequired')` |
| `'Enable camera access in Settings to use AR view.'` | `t('ar.permissionDenied')` |
| `<Button title="Grant Permission"` | `<Button title={t('ar.grantPermission')}` |

The resulting permission-denied block becomes:
```tsx
  if (!camPermission.granted) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>
          {camPermission.canAskAgain
            ? t('ar.permissionRequired')
            : t('ar.permissionDenied')}
        </Text>
        {camPermission.canAskAgain && (
          <Button title={t('ar.grantPermission')} onPress={requestCamPermission} />
        )}
      </View>
    );
  }
```

- [ ] **Step 4.2: Update `src/components/RadarView.tsx`**

Add `useTranslation` to the react-i18next import:
```tsx
import { useTranslation } from 'react-i18next';
```

Add `const { t } = useTranslation();` inside the `RadarView` function, right after `const { width, height } = useWindowDimensions();`.

Replace the hardcoded SVG text content:

Before:
```tsx
          <SvgText x={0} y={4} fill="#6b7280" fontSize={11} textAnchor="middle" fontFamily="sans-serif">
            Locating…
          </SvgText>
```

After:
```tsx
          <SvgText x={0} y={4} fill="#6b7280" fontSize={11} textAnchor="middle" fontFamily="sans-serif">
            {t('radar.locating')}
          </SvgText>
```

- [ ] **Step 4.3: Update `src/hooks/useLocation.ts`**

Add `i18n` import at the top of the file:
```ts
import i18n from '../i18n';
```

Replace:
```ts
setState({ coords: null, error: 'Location permission not granted' });
```

With:
```ts
setState({ coords: null, error: i18n.t('errors.locationPermission') });
```

- [ ] **Step 4.4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4.5: Run all tests**

```bash
npm test
```

Expected: all pass (49 tests).

- [ ] **Step 4.6: Commit**

```bash
git add app/ar.tsx src/components/RadarView.tsx src/hooks/useLocation.ts
git commit -m "feat(M7): replace hardcoded strings with t() calls in ar.tsx, RadarView, useLocation"
```

---

### Task 5: Verify on device

- [ ] **Step 5.1: Run on device**

```bash
npx expo run:ios --device
```

- [ ] **Step 5.2: Verify acceptance criteria**

- [ ] Gear icon ⚙️ visible in the home screen header
- [ ] Tapping it opens the Settings screen with a language list
- [ ] Current language has a green `✓` checkmark
- [ ] Tapping a different language instantly switches the whole app (home title, nav labels, etc.)
- [ ] After killing and restarting the app, the selected language is remembered
- [ ] Camera permission strings in AR screen are translated
- [ ] "Locating…" text in radar is translated
- [ ] Location error text is translated

---

## Self-Review

**Spec coverage:**
- ✅ All 5 new keys added to all 8 locale files (Tasks 1.1–1.8)
- ✅ `LanguagePicker`: SUPPORTED list, NAMES map, current language check, setLanguage call
- ✅ `settings.tsx`: language heading + LanguagePicker
- ✅ `_layout.tsx`: settings route registered, gear icon headerRight on index
- ✅ `ar.tsx`: 3 camera strings replaced with `t()`
- ✅ `RadarView.tsx`: 'Locating…' replaced with `t('radar.locating')`
- ✅ `useLocation.ts`: error string replaced with `i18n.t('errors.locationPermission')`

**Placeholder scan:** None found.

**Type consistency:**
- `setLanguage(tag: string)` exported from `src/i18n/index.ts` — `LanguagePicker` calls it with each `tag` from `SUPPORTED: string[]` ✓
- `i18n.t('errors.locationPermission')` — key exists in all locale files after Task 1 ✓
- `t('ar.permissionRequired')` / `t('ar.permissionDenied')` / `t('ar.grantPermission')` — keys exist after Task 1 ✓
- `t('radar.locating')` — key exists after Task 1 ✓
- `router.push('/settings')` — route registered in `_layout.tsx` ✓
