# System Overview

## Input Pipeline
- Pointer or Android bridge events feed [src/input/engine/inputRouter.js](src/input/engine/inputRouter.js), which normalizes callbacks to the intent layer.
- [src/input/engine/intentEngine.js](src/input/engine/intentEngine.js) owns gesture mechanics: tracking phases, deltas, axis locking, and direction sign.
- [src/input/engine/engineAdapter.js](src/input/engine/engineAdapter.js) relays intents to the resolver and renderer, keeping the engine decoupled from DOM and animation.
- [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js) resolves DOM targets via [src/input/dom/domRegistry.js](src/input/dom/domRegistry.js) and builds reaction descriptors.
- [src/input/render/renderer.js](src/input/render/renderer.js) applies descriptors, updates [src/state/swipeState.js](src/state/swipeState.js), and emits component-facing events consumed by [src/components/SwipeCarousel.vue](src/components/SwipeCarousel.vue) and scenes.

## Ownership Mapping
- Gesture mechanics (delta, axis, direction): [src/input/engine/intentEngine.js](src/input/engine/intentEngine.js).
- Intent resolution (what the gesture targets and which reactions exist): [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js) using [src/input/dom/domRegistry.js](src/input/dom/domRegistry.js).
- Decision thresholds (start/commit sizing): [src/state/swipeState.js](src/state/swipeState.js) with fallback sizing from [src/state/domState.js](src/state/domState.js) invoked by [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js).

## Data Flow Diagram
```
pointer / Android
   ↓
inputRouter
   ↓
intentEngine (mechanics)
   ↓
engineAdapter
   ↓
reactionResolver → domRegistry (intent)
   ↓
renderer → swipeState (thresholds/state)
   ↓
SwipeCarousel / scenes
```
