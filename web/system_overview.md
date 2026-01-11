# System Overview

## High-Level Structure
- Vue 3 SPA mounted in [src/main.js](src/main.js#L1-L32) -> [src/App.vue](src/App.vue#L1-L15) -> scene root [src/scenes/Root.vue](src/scenes/Root.vue).
- Debug surface for web (`DebugWrapper`, `DebugPanel`) surrounds the main Root when enabled via [src/config/appSettings.js](src/config/appSettings.js#L1-L20).
- Input pipeline is platform-aware: [src/input/engine/inputRouter.js](src/input/engine/inputRouter.js#L20-L76) wires browser pointer events or Android bridge callbacks into a gesture state machine.
- Gesture state machine: [src/input/engine/intentEngine.js](src/input/engine/intentEngine.js#L1-L138) detects press, swipe start/drag/end, and releases. It delegates rendering decisions to the adapter stack.
- Adapter + resolver: [src/input/engine/engineAdapter.js](src/input/engine/engineAdapter.js#L1-L58) forwards intents to [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L46-L158) to resolve DOM targets and build reaction descriptors.
- Renderer + shared state: [src/input/render/renderer.js](src/input/render/renderer.js#L1-L72) applies data attributes, updates [src/state/swipeState.js](src/state/swipeState.js#L1-L80), and dispatches CustomEvents to the component tree.
- Visual lanes: carousels in [src/components/SwipeCarousel.vue](src/components/SwipeCarousel.vue#L1-L155) read `swipeState` to position scenes; lane metadata (size, count) is set via resize observers.

## Data / Event Flow
```
pointer/Android events
   ↓
[inputRouter]
   ↓
[intentEngine]  (detect axis/direction, track deltas)
   ↓
[engineAdapter]
   ↓
[reactionResolver] ── domRegistry lookup → targets/reactions
   ↓
[renderer]
   ├─ set data-* flags on elements
   ├─ update swipeState (lane offset/index/pendingDir)
   └─ dispatch CustomEvent('reaction') to Vue components
   ↓
[SwipeCarousel + scenes] consume swipeState to render positions
```

## Responsibilities by Module
- App shell: [src/main.js](src/main.js#L1-L32) initializes Vue, input system, and layout refresh hooks; [src/App.vue](src/App.vue#L1-L15) toggles debug chrome.
- Configuration: [src/config/appSettings.js](src/config/appSettings.js#L1-L20) defines platform, device defaults, swipe ratios, and animation timing.
- Debug utilities: [src/debug/functions.js](src/debug/functions.js#L1-L48) gated logging and visual dots; flags in [src/debug/debugFlags.js](src/debug/debugFlags.js#L1-L10).
- DOM registry: [src/input/dom/domRegistry.js](src/input/dom/domRegistry.js#L1-L71) is the single authority for reading `data-*` intent declarations.
- State: [src/state/swipeState.js](src/state/swipeState.js#L1-L80) holds per-lane index/offset/size and threshold helpers.
- UI controls: [src/components/inputElement.vue](src/components/inputElement.vue#L1-L89) declares press/swipe capabilities and re-emits reaction events; [src/components/SwipeCarousel.vue](src/components/SwipeCarousel.vue#L1-L155) renders scene triplets with GPU-accelerated transforms.

## Patterns and Design Decisions
- Layered input architecture (router → intent engine → adapter → resolver → renderer) isolates DOM access to the resolver/renderer and keeps detection pure.
- Declarative intent via `data-*` attributes centralizes hit-testing in `domRegistry`, enabling cross-platform parity.
- Shared reactive `swipeState` ensures renderer and carousels remain in sync without direct component coupling.
- Debug-first defaults (logs/dots/panels) ease instrumentation in web/testing contexts.

## Notable Flows / Edge Considerations
- Swipe thresholds derive from lane dimensions set by `ResizeObserver` in [SwipeCarousel](src/components/SwipeCarousel.vue#L26-L45); thresholds fail closed when sizes are missing.
- Android bridge exposes `window.handleTouch` and `window.initAndroidEngine` for native injection, matching browser pointer semantics.
