# Milestone 7 — Localization Design

**Goal:** Wrap the handful of hardcoded strings added in M1–M6, add their translations to all 8 locale files, implement `LanguagePicker`, and add a gear-icon-accessible Settings screen so users can switch language at runtime.

---

## Architecture

Seven files change in M7.

| File | Change |
|---|---|
| `src/components/LanguagePicker.tsx` | FILL IN — language list with native names + checkmarks |
| `app/settings.tsx` | CREATE — settings screen with Language heading + LanguagePicker |
| `app/_layout.tsx` | MODIFY — register /settings route, gear icon on home header |
| `src/i18n/locales/en-US.json` + 7 others | ADD — 5 new keys for M1–M6 hardcoded strings |
| `app/ar.tsx` | MODIFY — replace 3 hardcoded camera strings with `t()` |
| `src/components/RadarView.tsx` | MODIFY — replace `'Locating…'` with `t()` |
| `src/hooks/useLocation.ts` | MODIFY — replace hardcoded error string with `i18n.t()` |

The i18n infrastructure (initI18n, 8 locale files, setLanguage, SUPPORTED list) was built in M0 and requires no changes.

---

## New i18n Keys

Five new keys are added to all 8 locale JSON files.

| Key | en-US / en-GB | fr-FR | pt-PT | pt-BR | es-ES | de-DE | it-IT |
|---|---|---|---|---|---|---|---|
| `ar.permissionRequired` | Camera permission required for AR view. | Autorisation de caméra requise pour la vue RA. | Permissão de câmara necessária para a vista RA. | Permissão de câmera necessária para a vista RA. | Permiso de cámara requerido para la vista RA. | Kameraberechtigung für die AR-Ansicht erforderlich. | Autorizzazione fotocamera richiesta per la vista RA. |
| `ar.permissionDenied` | Enable camera access in Settings to use AR view. | Activez l'accès à la caméra dans les réglages pour utiliser la vue RA. | Ative o acesso à câmara nas definições para usar a vista RA. | Ative o acesso à câmera nas configurações para usar a vista RA. | Active el acceso a la cámara en Ajustes para usar la vista RA. | Aktivieren Sie den Kamerazugriff in den Einstellungen für die AR-Ansicht. | Abilita l'accesso alla fotocamera nelle impostazioni per usare la vista RA. |
| `ar.grantPermission` | Grant Permission | Accorder l'autorisation | Conceder permissão | Conceder permissão | Conceder permiso | Berechtigung erteilen | Concedi autorizzazione |
| `radar.locating` | Locating… | Localisation… | A localizar… | Localizando… | Localizando… | Lokalisiere… | Localizzazione… |
| `errors.locationPermission` | Location permission not granted | Autorisation de localisation refusée | Permissão de localização não concedida | Permissão de localização não concedida | Permiso de ubicación no concedido | Standortberechtigung nicht erteilt | Autorizzazione posizione non concessa |

---

## `LanguagePicker` — `src/components/LanguagePicker.tsx`

No props. Reads current language from `i18n.language` (via `useTranslation()`). Renders a `FlatList` over `SUPPORTED` (imported from `src/i18n/index.ts`).

Each row:
- Left: language display name in its **native language** (see map below)
- Right: `✓` checkmark when the row's tag matches `i18n.language`

Tapping a row calls `setLanguage(tag)` (exported from `src/i18n/index.ts`) — the whole app re-renders in the new language immediately.

### Native name map (hardcoded constant in the component)

```ts
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
```

---

## Settings Screen — `app/settings.tsx`

Dark background (`backgroundColor: '#000'`). Two elements:

1. Section heading: `t('settings.language')` — grey `#9ca3af`, 13px uppercase label
2. `<LanguagePicker />`

```tsx
export default function SettingsScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('settings.language')}</Text>
      <LanguagePicker />
    </View>
  );
}
```

---

## `_layout.tsx` changes

### 1. Register /settings route

```tsx
<Stack.Screen name="settings" options={{ title: t('settings.title') }} />
```

### 2. Gear icon on home screen header

```tsx
<Stack.Screen
  name="index"
  options={{
    title: t('home.title'),
    headerRight: () => (
      <Pressable onPress={() => router.push('/settings')} style={{ marginRight: 12 }}>
        <Text style={{ fontSize: 22 }}>⚙️</Text>
      </Pressable>
    ),
  }}
/>
```

`router` is obtained from `useRouter()` inside `RootLayout`. `Pressable` and `Text` are imported from `react-native`.

---

## String Replacements in Existing Files

### `app/ar.tsx`

| Before | After |
|---|---|
| `'Camera permission required for AR view.'` | `t('ar.permissionRequired')` |
| `'Enable camera access in Settings to use AR view.'` | `t('ar.permissionDenied')` |
| `<Button title="Grant Permission"` | `<Button title={t('ar.grantPermission')}` |

Add `useTranslation` import. Add `const { t } = useTranslation();` inside `ARScreen`.

### `src/components/RadarView.tsx`

| Before | After |
|---|---|
| `Locating…` (SVG text content) | `{t('radar.locating')}` |

Import `useTranslation` from `react-i18next`. Call `const { t } = useTranslation();` inside `RadarView`.

### `src/hooks/useLocation.ts`

| Before | After |
|---|---|
| `'Location permission not granted'` | `i18n.t('errors.locationPermission')` |

Import `i18n` (default export) from `../i18n`. Use `i18n.t()` directly (not the hook) since hooks cannot be called from non-component code.

---

## Error Handling

- Language change is instant — `setLanguage(tag)` calls `i18n.changeLanguage` which triggers React re-renders throughout the app via the react-i18next context.
- If a locale file is missing a key, i18next falls back to `en-US` (configured in M0 as fallback).
- `i18n.t()` in `useLocation.ts` is called after `initI18n()` completes (the root layout waits for it before rendering), so the i18n instance is always ready by the time a user can trigger a location request.

---

## Acceptance Criteria

- [ ] Tapping the gear icon on the home screen opens the Settings screen
- [ ] Settings screen shows a list of 8 languages with the current one checked
- [ ] Tapping a language switches the whole app immediately (home, radar, AR screens all update)
- [ ] After restart, the selected language is remembered (AsyncStorage persistence already in M0)
- [ ] AR permission strings, "Locating…", and location error are translated in all 8 locales
- [ ] `npx tsc --noEmit` passes; all existing tests pass
