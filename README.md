# PlaneSpotter

An augmented reality airplane tracker for iOS and Android. Point your phone at the sky and see live aircraft as labelled markers overlaid on the camera feed, positioned by where the device is actually aimed — the same idea as Star Walk 2, but the catalog is live ADS-B data instead of stars.

Each marker shows the airline logo (or a military / N/A badge), callsign, departure → destination airports, and altitude.

---

## Features

- **AR overlay** — aircraft markers placed on the live camera feed using magnetometer + accelerometer for pointing direction
- **2D radar** — top-down view of nearby traffic, north-up, device heading indicator
- **Live ADS-B data** — pulls from OpenSky Network via a secure server-side proxy (credentials never in the app binary)
- **Route enrichment** — departure and destination airports resolved per callsign from adsbdb
- **Airline identification** — ICAO designator → name + logo; military prefixes get a shield badge; unknowns get N/A
- **Dead reckoning** — markers glide smoothly between 5–10 s ADS-B polls
- **Fully localised** — en-US, en-GB, fr-FR, pt-PT, pt-BR, es-ES, de-DE, it-IT; device locale auto-selected on first launch

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Expo SDK 56 (React Native 0.85, React 19) |
| Navigation | Expo Router |
| Language | TypeScript (strict) |
| Sensors | expo-sensors (magnetometer + accelerometer) |
| Location | expo-location |
| Camera | expo-camera (AR); react-native-vision-camera (optional, M9) |
| ADS-B | OpenSky Network REST API via Expo API route proxy |
| Routes | adsbdb public API |
| i18n | i18next + react-i18next + expo-localization |

---

## Prerequisites

- **Node.js 22.13+**
- **Expo CLI** — `npm install -g expo-cli` (or use `npx expo`)
- **A physical device** — the simulator has no magnetometer or camera; all meaningful testing is on-device
- **CocoaPods** (iOS) — `brew install cocoapods` or `sudo gem install cocoapods`
- A development build is required (camera APIs are not available in Expo Go)

---

## Getting started

```bash
# Install dependencies
npm install

# iOS — install native pods first
cd ios && pod install && cd ..

# Run on a connected iOS device
npx expo run:ios --device

# Run on a connected Android device
npx expo run:android --device
```

### OpenSky credentials (optional — anonymous access works with tighter rate limits)

1. Register at https://opensky-network.org/ and create an API client
2. Copy `.env.example` to `.env.local` and fill in your credentials:
   ```
   OPENSKY_CLIENT_ID=your_client_id
   OPENSKY_CLIENT_SECRET=your_client_secret
   ```
3. The `app/api/states+api.ts` route holds the secret server-side and proxies requests to OpenSky. **Never put the secret in the app binary.**

### Regenerate the airlines database

```bash
node scripts/build-airlines.mjs
```

This fetches the OpenFlights airlines dataset and writes `assets/airlines.json` (ICAO code → name + IATA). A generated copy is already committed; re-run any time to refresh.

---

## Project structure

```
app/                    Expo Router screens
  _layout.tsx           Root layout (i18n init, Stack navigator)
  index.tsx             Home: Radar / AR buttons + permission status
  radar.tsx             2D radar view (Milestone 2)
  ar.tsx                AR camera overlay (Milestone 6)
  api/states+api.ts     OpenSky proxy route (Milestone 3)
src/
  types.ts              Shared domain types
  api/                  opensky.ts, adsbdb.ts
  hooks/                useLocation, useDeviceOrientation, useAircraft
  lib/                  geo.ts, projection.ts, airlines.ts, format.ts
  i18n/                 i18next init + 8 locale JSON files
  components/           PlaneSprite, AirlineTag, PlaneMarker, RadarView, AROverlay, …
assets/
  airlines.json         Generated airline lookup (ICAO → name, IATA)
  logos/                Bundled airline logo pack
scripts/
  build-airlines.mjs    Generates assets/airlines.json
```

---

## Milestones

| # | What | Status |
|---|---|---|
| 0 | Skeleton — scaffold, packages, types, i18n, permissions | ✅ Done |
| 1 | Sensors + debug readout | Pending |
| 2 | 2D radar (no camera) | Pending |
| 3 | Proxy + polling + dead reckoning | Pending |
| 4 | Airline identification + tags | Pending |
| 5 | Route enrichment (departure → destination) | Pending |
| 6 | AR overlay (projected sprites) | Pending |
| 7 | Localization | Pending |
| 8 | Polish (tap detail, altitude filter, off-screen arrows) | Pending |
| 9 | Visual detection (optional, experimental) | Pending |

Each milestone has acceptance criteria that must pass on a physical device before the next begins.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[MIT](LICENSE) © 2026 Antonio Goulao
