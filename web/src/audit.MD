Plan: Comprehensive Project Audit & Future Roadmap
Based on my thorough review of your codebase, here's the audit summary and future improvement plan.

🟢 What's Working Well
Architecture: Clean separation between gesture engines (JS vs Android), event bus pattern, and carousel controller
Cross-platform design: gestureEngineRouter auto-detects and switches between jsEngine and androidGestureAdapter
Performance fixes: Choreographer for momentum, move event throttling, on-demand redraw, seqId for stale event rejection
Component lifecycle: Proper onMounted/onBeforeUnmount cleanup in TouchArea.vue
Debug system: Centralized logging with category toggles in appSettings.js
Steps (Audit Findings)
Remove debug console.log in production code - buttonGrid.vue has console.log('pressed') and console.log('released') that will spam logs in production.

Fix DebugPanel.vue using setInterval without cleanup - DebugPanel.vue has a 16ms interval that's never cleared, causing memory leak if component unmounts. Should use onBeforeUnmount to clear it.

Cross-platform threshold consistency - Both engines use APP_SETTINGS.input.swipeThreshold (8px) ✅, but verify jsEngine.js and androidGestureAdapter.js use same value at runtime.

Dead code removal - SwipeEngine.kt has an unused mainHandler import (line 4) and gestureState.js is only used by jsEngine, not Android.

Missing error handling - initAndroidBridge.js uses setTimeout(initialize, 100) for race condition handling, but no retry limit or error fallback in JS side.

Further Considerations
Production build optimization: Should debug logging be stripped in production builds? Consider environment-based DEBUG.enabled = false via Vite's import.meta.env.PROD.

Momentum for page carousel vs continuous scroll: Currently momentum is ignored for the page-based carousel (carouselGestureController.js#L80-L84). If you want smooth-scrolling carousels in the future, you'd need a different controller that uses momentum.

Multi-touch support: Current implementation only handles single finger touches. If you need pinch-zoom or two-finger gestures, you'd need to track MotionEvent.getPointerCount() in Kotlin and coordinate tracking in JS.

🔮 Future Improvement Roadmap
Priority	Task	Benefit
High	Strip debug logs in production (DEBUG.enabled = import.meta.env.PROD ? false : true)	Reduce console spam, slight perf gain
High	Fix DebugPanel interval leak	Prevent memory leak
Medium	Add velocity-based swipe detection	Allow quick flicks to commit even if distance threshold not met
Medium	WebView preloading for wallpaper scenes	Reduce first-render delay when swiping to new scene
Medium	Create unified test harness	Run same gesture sequences in npm and APK to verify identical behavior
Low	Consider removing SwipeEngine.kt momentum	Since carousel ignores it anyway, simplify by just sending up immediately
Low	Add haptic feedback on swipe commit	Better UX on Android via Android.vibrate() JSBridge method
Low	Lazy-load lane scenes	Only render visible + adjacent scenes, not all 12
Would you like me to elaborate on any specific finding or create a detailed implementation plan for any of the roadmap items?


Plan: Refined Audit & Next Steps
Incorporate prior findings plus the new audit: tighten production logging/cleanup, resolve coordinate and momentum mismatches, and harden initialization for consistent WebView/browser behavior.

Steps
Normalize coordinates and thresholds across WebView/browser; align 364 vs 352 bases and confirm runtime use of swipeThreshold in engines [src/input/core/androidGestureAdapter.js#L53-L118], [java/com/ad/webwallpaper/WebWallpaperService.kt#L22-L44], [src/config/appSettings.js#L1-L90], [src/scenes/WallpaperRoot.vue#L1-L140], [src/input/engines/jsEngine.js#L10-L170].
Trim production noise: strip or gate debug logs and button grid console output; set DEBUG.enabled via env for release [src/config/appSettings.js#L35-L65], [src/components/buttonGrid.vue#L1-L140].
Fix lifecycle leaks and double-init: clear DebugPanel interval on unmount and guard input init/listeners to avoid duplicates [src/components/DebugPanel.vue#L1-L180], [src/bootstrap/initInputSystem.js#L1-L12].
Decide momentum strategy: keep Android-only and drop Kotlin momentum pipeline or add parity in JS controller; adjust bridge throttling/batching accordingly [src/input/core/carouselGestureController.js#L70-L118], [java/com/ad/webwallpaper/SwipeEngine.kt#L45-L99], [java/com/ad/webwallpaper/WebWallpaperService.kt#L123-L214].
Harden input engine: add resize debouncing and optional pointer capture/multi-touch guards; verify gesture state use vs dead code [src/composables/useScale.js#L7-L34], [src/input/engines/jsEngine.js#L10-L170], [src/input/core/gestureEngineRouter.js#L1-L120], [src/input/debug/gestureDebug.js#L1-L200].
Further Considerations
Momentum: Option A parity on both platforms; Option B remove Android momentum to simplify.
Bridge IPC: Option A switch to WebMessage/batching; Option B keep eval with tighter throttles.
Testing: Option A build a shared gesture harness (npm + APK); Option B start with targeted unit tests for scaling/threshold math.