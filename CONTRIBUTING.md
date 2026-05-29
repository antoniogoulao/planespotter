# Contributing to PlaneSpotter

Thanks for taking the time to contribute. This document covers everything you need to know before opening an issue or pull request.

---

## Ground rules

- Follow the milestone order in the spec (`PLANESPOTTER_SPEC.md`). Each milestone has acceptance criteria that must pass on a **physical device** before work on the next begins.
- No feature work on `main` directly — open a branch and a PR.
- Keep PRs focused: one milestone (or one bugfix) per PR.
- All visible strings must go through `t()` from `react-i18next`. No hardcoded copy in JSX.
- Numbers, altitudes, speeds, and times must go through `src/lib/format.ts`. No `toLocaleString()` calls without the locale.

---

## Development setup

```bash
# Install dependencies
npm install

# iOS
cd ios && pod install && cd ..
npx expo run:ios --device

# Android
npx expo run:android --device
```

A simulator is not sufficient for most features — you need a real device with a working magnetometer and camera.

---

## Branching

```
main          stable, milestone-complete code
milestone/<n>   active milestone work
fix/<short-desc>  targeted bugfixes
```

Branch from `main`, keep commits small and descriptive.

---

## Commit messages

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short summary>
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.  
Scope is the milestone or area, e.g. `M1`, `M3`, `i18n`, `radar`, `ar`.

Examples:

```
feat(M1): add useDeviceOrientation with magnetometer smoothing
fix(M3): handle 429 rate-limit from OpenSky proxy
chore: update expo-sensors to 56.1.0
```

---

## Code style

- TypeScript `strict: true` — no `any`, no type assertions without a comment explaining why.
- No comments that describe *what* the code does — only *why* when the reason is non-obvious.
- No dead code, no backwards-compat shims for things that can just be deleted.
- Prefer small, focused files. If a file is getting unwieldy, split by responsibility.

---

## Adding or updating translations

Locale files live in `src/i18n/locales/`. `en-US.json` is the source of truth — every key must exist there. Other files may be partial; missing keys fall back through the chain defined in `src/i18n/index.ts`.

When adding a new key:
1. Add it to `en-US.json` first.
2. Add translations for the other locales you can vouch for.
3. Leave the rest for native speakers to fill in — open the PR and note which translations are missing.

Before any public release, all translations should be reviewed by a native speaker.

---

## Airline logos

Logos are trademarks. For a hobby/personal build, showing them to identify a flight is generally accepted. If you intend to publish the app, verify each airline's usage terms. Bundling a curated local pack (rather than hotlinking a CDN) is the correct approach per the spec.

---

## Reporting issues

Please include:
- Device model and OS version
- Expo SDK version (`expo --version`)
- Steps to reproduce
- What you expected vs. what happened
- Relevant log output (Metro, device logs via `npx expo run:ios` / `npx expo run:android`)

---

## Pull requests

1. Fork the repo and create your branch from `main`.
2. Make your changes, commit with conventional commit messages.
3. Open a PR against `main` with a clear description of what changed and why.
4. Link to the milestone or issue being addressed.
5. The acceptance criteria from `PLANESPOTTER_SPEC.md` are the test plan — note which ones you verified on device.

---

## License

By contributing you agree that your work will be released under the [MIT License](LICENSE).
