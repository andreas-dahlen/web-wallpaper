# System Overview

## Input Pipeline (Layers)

## Ownership Mapping

## Flow Diagram
```
platform input (pointer / Android)
   ↓
inputRouter (wire)
   ↓
intentEngine (detect)
   ↓
engineAdapter (bridge)
   ↓
reactionResolver → domRegistry (resolve intent)
   ↓
renderer → swipeState (apply / mutate)
   ↓
Vue layers (SwipeCarousel, scenes)
```
# System Overview

## Architecture
- [src/input/engine/inputRouter.js](src/input/engine/inputRouter.js): Platform wiring; listens to pointer/Android events, normalizes to x/y, forwards to the engine.
- [src/input/engine/intentEngine.js](src/input/engine/intentEngine.js): Math-only gesture state machine; tracks phases, axis lock, total delta, and raw x/y.
- [src/input/engine/engineAdapter.js](src/input/engine/engineAdapter.js): Thin bridge; queries resolver eligibility and forwards reaction descriptors to the renderer.
- [src/input/dom/domRegistry.js](src/input/dom/domRegistry.js): Read-only DOM authority; inspects data-* to describe intents, lanes, swipeType, and reactions.
- [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js): Intent resolution; applies swipeType/axis rules, lane lookups, selection toggles, and returns plain descriptors.
- [src/input/render/renderer.js](src/input/render/renderer.js): Side effects only; sets data attributes, updates [src/state/swipeState.js](src/state/swipeState.js), dispatches `reaction` events.
- UI surface: [src/components/InputElement.vue](src/components/InputElement.vue) declares data-* hooks and optionally re-emits reactions; [src/components/SwipeCarousel.vue](src/components/SwipeCarousel.vue) renders lane content using swipeState offsets.
- Supporting state: [src/state/domState.js](src/state/domState.js) provides device scale; [src/state/swipeState.js](src/state/swipeState.js) stores lane offsets/counts/thresholds.

## Data Flow
```
platform input (pointer / Android)
    ↓
inputRouter (wire)
    ↓
intentEngine (detect axis, delta, raw xy)
    ↓
engineAdapter (bridge)
    ↓
reactionResolver → domRegistry (resolve intent, swipeType, lane)
    ↓
renderer → swipeState (mutate offsets/flags, emit reaction event)
    ↓
Vue consumers (InputElement emits, SwipeCarousel visuals)
```

## Responsibilities & Boundaries
- Mechanics: intentEngine owns axis detection and delta math only.
- Resolution: reactionResolver decides eligibility (lane, swipeType, selectable) and emits descriptors; it never mutates DOM or state.
- Effects: renderer is the sole mutator of DOM attrs and swipeState.
- DOM knowledge: domRegistry is the only reader of data-* attributes; others consume its intent objects.
- Vue layer: InputElement opts into reactions via `react*` props; SwipeCarousel reads swipeState to render motion.

## Notable Design Choices
- Selection is visual-only (select/deselect descriptors) and scoped to one element at a time.
- Raw `{x, y}` travels alongside axis-locked delta for future features (drag, swipeMove) without altering current swipe math.
- swipeType gating allows lanes/elements to restrict gestures to a specific axis.
