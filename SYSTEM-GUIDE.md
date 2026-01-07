# System Guide

## Overview
- Android host (Kotlin, single `app` module) runs a fullscreen WebView launcher that bridges to JS via `JSBridge` and gesture plumbing in `LauncherActivity`.
- Vue 3 + Vite frontend (single-page, bundled to a single file with `vite-plugin-singlefile`) provides the wallpaper UI and gesture logic.
- Data flows: Kotlin injects device metrics into JS; JS gestures call back into Android via `Android` interface; build scripts copy the Vite bundle into Android assets (see `scripts/deploy-*.js`).

## Repo Map (key paths)
- Android: [android/app/build.gradle.kts](android/app/build.gradle.kts), [android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml), [android/app/src/main/java/com/ad/launcher](android/app/src/main/java/com/ad/launcher)
- Gradle: [android/settings.gradle.kts](android/settings.gradle.kts), [android/gradle/libs.versions.toml](android/gradle/libs.versions.toml), [android/gradle/wrapper/gradle-wrapper.properties](android/gradle/wrapper/gradle-wrapper.properties), [android/gradle.properties](android/gradle.properties)
- Web: [web/package.json](web/package.json), [web/vite.config.js](web/vite.config.js), [web/src](web/src)
- Docs/templates: [README.md](README.md) (Android-leaning, outdated), [web/README.md](web/README.md)

## Config Snapshot
- Gradle Wrapper: 8.13 (bin) per [android/gradle/wrapper/gradle-wrapper.properties](android/gradle/wrapper/gradle-wrapper.properties#L1-L7)
- Version catalog: AGP 8.13.2, Kotlin 2.0.21 per [android/gradle/libs.versions.toml](android/gradle/libs.versions.toml#L1-L24)
- Android app: namespace `com.ad.launcher`, compileSdk `release(36)` (non-standard), targetSdk 36, minSdk 35, JVM target 11 per [android/app/build.gradle.kts](android/app/build.gradle.kts#L1-L47)
- Manifest: launcher activity exported with HOME/LAUNCHER categories; hardware acceleration enabled per [android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml#L1-L33)
- Vue/Vite: Vue 3.5.24, Vite 7.2.4, @vitejs/plugin-vue 6.0.1, vite-plugin-singlefile 2.3.0; base set to `./`, build target `es2015`, minify on per [web/package.json](web/package.json#L1-L21) and [web/vite.config.js](web/vite.config.js#L1-L15)
- Scripts: `npm run build:android` and `build:debug` invoke Vite then node deploy scripts (see [web/package.json](web/package.json#L6-L20))
- Linters/formatters: no ESLint/Prettier/Stylelint or Android lint configs detected; Kotlin uses `kotlin.code.style=official` in [android/gradle.properties](android/gradle.properties#L1-L20)

## Build & Release Scaffolding (static)
- Android: single application module; release build type without minify; ProGuard file referenced but default rules only.
- Web: Vite single-page build into a single file (likely copied into Android assets by scripts); no CI config present in repo snapshot.

## Conventions & Patterns
- Vue uses `<script setup>` components, single-file bundling, and design variables for viewport scaling; debug harness in `DebugScreen.vue` wraps the app for browser testing.
- Android code centers on `LauncherActivity` hosting WebView with a JS bridge (`JSBridge`) and gesture handling (`SwipeEngine`, `gestureHandler.js`).
- Version catalog drives plugin and dependency versions; namespaces match manifest.

## Assumptions / Unknowns
- Actual asset copy pipeline relies on `scripts/deploy-*.js` (not reviewed in depth here); CI/build steps not provided.
- No lint/format configs for JS/Vue or Kotlin beyond defaults; test coverage unassessed (tests dirs present but likely empty).
- compileSdk DSL uses `release(36)` which may be invalid depending on AGP; behavior not verified without running Gradle.
