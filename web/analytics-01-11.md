# Analytics and Code Review

## Naming
- Clear intent for layers (`inputRouter`, `intentEngine`, `reactionResolver`, `renderer`) and state (`swipeState`) keeps responsibilities readable.
- `laneAxis` vs `direction` is handled via normalization in [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L21-L44); consistent but warrants documentation at the call sites.

## Code Quality / Maintainability
- Strong separation of concerns across the input pipeline; DOM access is isolated to [src/input/dom/domRegistry.js](src/input/dom/domRegistry.js#L1-L71) and rendering effects to [src/input/render/renderer.js](src/input/render/renderer.js#L1-L72).
- Swipe threshold gating in [src/input/engine/intentEngine.js](src/input/engine/intentEngine.js#L60-L120) depends on lane dimensions being set before the first gesture; until `ResizeObserver` populates size, swipes are rejected.
- Debug logging defaults to enabled because `DEBUG.enabled` falls back to `true` when the env var is absent in [src/debug/debugFlags.js](src/debug/debugFlags.js#L1-L10); consider inverting for production builds.

## Potential Bugs / Risks
- **Init-time sizing race:** First gestures before `ResizeObserver` runs will see `lane.size` as zero, preventing swipes until a resize occurs in [src/components/SwipeCarousel.vue](src/components/SwipeCarousel.vue#L26-L45) and [src/state/swipeState.js](src/state/swipeState.js#L12-L29).
- **Logging noise:** With `DEBUG.enabled` defaulting to true, console noise and performance overhead may persist in production builds [src/debug/debugFlags.js](src/debug/debugFlags.js#L1-L10).

## Recommendations (Prioritized)
- **Should address:** Default `DEBUG.enabled` to the env flag only (or false) to reduce production logging [src/debug/debugFlags.js](src/debug/debugFlags.js#L1-L10).
- **Nice to improve:** Harden swipe startup by caching lane sizes or seeding them once on mount so first-gesture failures are unlikely [src/components/SwipeCarousel.vue](src/components/SwipeCarousel.vue#L26-L45).
- **Nice to improve:** Consider explicit cleanup or idempotent guards for browser event wiring in [src/input/engine/inputRouter.js](src/input/engine/inputRouter.js#L20-L76) if hot-reloads re-run initialization.
