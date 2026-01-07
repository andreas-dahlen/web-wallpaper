# Improvements

## Quick wins (hours–day)
- Problem: Top-level README references ADWebWallpaper and mismatched package paths. Recommendation: Update README to reflect current launcher namespace and WebView launcher behavior. Expected Impact: Clear onboarding. Risk: Low. Confidence: High. References: [README.md#L1-L9](README.md#L1-L9)
- Problem: No JS/Vue lint/format setup (ESLint/Prettier) and no lockfile. Recommendation: Add ESLint + Prettier with Vue 3 presets and check in a `package-lock.json` or `pnpm-lock.yaml` after install. Expected Impact: Consistent code quality and reproducible installs. Risk: Low. Confidence: Medium. References: [web/package.json#L1-L21](web/package.json#L1-L21)
- Problem: compileSdk DSL uses `release(36)` which AGP may not recognize; target/min set to 36/35. Recommendation: Switch to the standard `compileSdk = 35` (or official 36 when available) and align targetSdk accordingly. Expected Impact: Avoid Gradle DSL errors and ensure predictable SDK targeting. Risk: Low. Confidence: Medium. References: [android/app/build.gradle.kts#L6-L37](android/app/build.gradle.kts#L6-L37)
- Problem: Vite build lacks explicit output dir and asset copy note. Recommendation: Document (or script) the copy of `dist` into Android assets in `scripts/deploy-*.js`; consider setting `build.outDir` to the expected assets path. Expected Impact: Fewer release mistakes. Risk: Low. Confidence: Medium. References: [web/vite.config.js#L1-L15](web/vite.config.js#L1-L15)
- Problem: No Android lint or ktlint/detekt configuration present. Recommendation: Enable Android Lint in CI and add a minimal ktlint/detekt config aligned with `kotlin.code.style=official`. Expected Impact: Early detection of regressions. Risk: Low. Confidence: Medium. References: [android/gradle.properties#L1-L20](android/gradle.properties#L1-L20)

## Medium (days)
- Problem: Extremely high minSdk (35) and targetSdk (36) reduce device coverage and may rely on preview SDKs. Recommendation: Reassess min/target to stable API (e.g., 34/35) and test WebView behavior; ensure bridge remains compatible. Expected Impact: Wider install base, fewer preview-specific issues. Risk: Medium. Confidence: Medium. References: [android/app/build.gradle.kts#L6-L37](android/app/build.gradle.kts#L6-L37)
- Problem: No automated build/test for web bundle integrated with Android packaging. Recommendation: Add a CI job to run `npm ci && npm run build:android` and verify bundle size/single-file output before Gradle assemble. Expected Impact: Catch frontend regressions before APK build. Risk: Medium. Confidence: Medium. References: [web/package.json#L6-L20](web/package.json#L6-L20)
- Problem: Frontend lacks accessibility labeling and formal routing/state conventions; several legacy files look unused. Recommendation: Add a lightweight a11y pass (labels/alts), define component/state conventions, and archive or delete unused files after reference check (e.g., `web/backup-random-code.vue`, `web/structure-copy-pasta.txt`, `web/src/TODO.me`). Expected Impact: Cleaner bundle, better UX. Risk: Medium. Confidence: Low. References: [web/src](web/src)

## Strategic (longer-term)
- Problem: No end-to-end tests covering Kotlin↔WebView↔Vue bridge. Recommendation: Add smoke E2E using Espresso (Android) plus Playwright/Puppeteer for the web bundle in a headless WebView harness. Expected Impact: Prevent regressions in gesture handling and JS bridge. Risk: Medium. Confidence: Medium. References: [android/app/src/main/java/com/ad/launcher](android/app/src/main/java/com/ad/launcher), [web/src](web/src)
- Problem: Asset pipeline not documented for release signing or multi-flavor support. Recommendation: Define release pipeline (keystore handling, shrinker settings, assets copy) and consider product flavors (debug/production) with matching Vite modes. Expected Impact: Repeatable releases and safer signing. Risk: Medium. Confidence: Low. References: [android/app/build.gradle.kts#L22-L37](android/app/build.gradle.kts#L22-L37), [web/package.json#L6-L20](web/package.json#L6-L20)
- Problem: Observability lacking (no perf/error logging on WebView side). Recommendation: Add minimal logging/metrics hooks in JS bridge and WebView settings (e.g., console capture) guarded by build type. Expected Impact: Faster triage of field issues. Risk: Medium. Confidence: Low. References: [android/app/src/main/java/com/ad/launcher/LauncherActivity.kt](android/app/src/main/java/com/ad/launcher/LauncherActivity.kt)

## Completed in this branch
- Added repository overview in SYSTEM-GUIDE.md.
- Added prioritized backlog in IMPROVEMENTS.md.

## Proposed diffs awaiting approval
- None (all risky changes noted above but not applied).

## What to verify manually
- Run `npm install` (or `npm ci` once a lockfile is added) and `npm run build:android`; confirm single-file output and deploy scripts copy assets correctly.
- Build Android app with Gradle to validate compileSdk/targetSdk settings and WebView permissions.
- Launch on a target device to ensure gesture handling and JS bridge function as expected in both browser and WebView contexts.
- Add lint/format tools and verify they pass on current codebase.
- Spot-check accessibility (labels/alts) and safe-area handling in the Vue UI.
