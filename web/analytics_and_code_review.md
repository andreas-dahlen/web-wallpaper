# Analytics and Code Review

## Naming
- Clear intent for layers (`inputRouter`, `intentEngine`, `reactionResolver`, `renderer`) and state (`swipeState`) keeps responsibilities readable.
- `laneAxis` vs `direction` is handled via normalization in [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L21-L44); consistent but warrants documentation at the call sites.
- Threshold helpers (`shouldStartSwipe`, `shouldCommitSwipe`) are descriptive; consider matching comparator semantics to avoid confusion (>= vs >) in [src/state/swipeState.js](src/state/swipeState.js#L12-L29).

## Code Quality / Maintainability
- Strong separation of concerns across the input pipeline; DOM access is isolated to [src/input/dom/domRegistry.js](src/input/dom/domRegistry.js#L1-L71) and rendering effects to [src/input/render/renderer.js](src/input/render/renderer.js#L1-L72).
- `reactionResolver.canStartSwipe` / `canCommitSwipe` return `undefined` when thresholds are not met, creating an implicit tri-state instead of explicit booleans in [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L132-L139). This weakens contracts for callers.
- `engineAdapter.shouldStartSwipe` / `shouldCommitSwipe` ignore the swipe axis, so the resolver cannot fall back to axis-specific viewport sizing if lane data is missing in [src/input/engine/engineAdapter.js](src/input/engine/engineAdapter.js#L32-L58).
- Swipe threshold gating in [src/input/engine/intentEngine.js](src/input/engine/intentEngine.js#L60-L120) depends on lane dimensions being set before the first gesture; until `ResizeObserver` populates size, swipes are rejected.
- Debug logging defaults to enabled because `DEBUG.enabled` falls back to `true` when the env var is absent in [src/debug/debugFlags.js](src/debug/debugFlags.js#L1-L10); consider inverting for production builds.

## Potential Bugs / Risks
- **Threshold contract ambiguity:** `canStartSwipe`/`canCommitSwipe` may return `undefined`; `intentEngine` treats that as false, but any future callers using strict booleans could mis-handle the result [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L132-L139).
- **Axis-less threshold checks:** Because axis is not passed into `shouldStartSwipe`/`shouldCommitSwipe`, there is no viewport-based fallback when `laneId` is missing or `lane.size` is zero. This can block swipes outside measured lanes or during initial mount [src/input/engine/engineAdapter.js](src/input/engine/engineAdapter.js#L47-L58) and [src/input/engine/intentEngine.js](src/input/engine/intentEngine.js#L60-L120).
- **Comparator mismatch:** Start uses `>=` while commit uses `>` in [src/state/swipeState.js](src/state/swipeState.js#L12-L29); near-threshold releases may cancel unexpectedly. Confirm intended hysteresis or align comparators.
- **Init-time sizing race:** First gestures before `ResizeObserver` runs will see `lane.size` as zero, preventing swipes until a resize occurs in [src/components/SwipeCarousel.vue](src/components/SwipeCarousel.vue#L26-L45) and [src/state/swipeState.js](src/state/swipeState.js#L12-L29).
- **Logging noise:** With `DEBUG.enabled` defaulting to true, console noise and performance overhead may persist in production builds [src/debug/debugFlags.js](src/debug/debugFlags.js#L1-L10).

## Recommendations (Prioritized)
- **Must fix:** Make `canStartSwipe`/`canCommitSwipe` return explicit booleans and accept `axis` so the resolver can apply viewport fallbacks when lane data is absent; update adapter/engine calls accordingly [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L132-L139), [src/input/engine/engineAdapter.js](src/input/engine/engineAdapter.js#L47-L58), [src/input/engine/intentEngine.js](src/input/engine/intentEngine.js#L60-L120).
- **Should address:** Decide on consistent threshold comparators (>= vs >) to avoid near-boundary cancellations in [src/state/swipeState.js](src/state/swipeState.js#L12-L29).
- **Should address:** Default `DEBUG.enabled` to the env flag only (or false) to reduce production logging [src/debug/debugFlags.js](src/debug/debugFlags.js#L1-L10).
- **Nice to improve:** Harden swipe startup by caching lane sizes or seeding them once on mount so first-gesture failures are unlikely [src/components/SwipeCarousel.vue](src/components/SwipeCarousel.vue#L26-L45).
- **Nice to improve:** Consider explicit cleanup or idempotent guards for browser event wiring in [src/input/engine/inputRouter.js](src/input/engine/inputRouter.js#L20-L76) if hot-reloads re-run initialization.
