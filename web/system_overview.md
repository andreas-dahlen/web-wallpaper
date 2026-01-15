# System Overview

## Input Pipeline (Layers)
- [src/input/engine/inputRouter.js](src/input/engine/inputRouter.js): Platform wiring; normalizes pointer/Android events to x/y and forwards to the engine.
- [src/input/engine/intentEngine.js](src/input/engine/intentEngine.js): Gesture mechanics; tracks phases, deltas, axis lock, and direction; emits intents only to the adapter.
- [src/input/engine/engineAdapter.js](src/input/engine/engineAdapter.js): Thin bridge; forwards intents to resolver/renderer and asks eligibility questions.
- [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js): Intent resolution; uses [src/input/dom/domRegistry.js](src/input/dom/domRegistry.js) to find targets/reactions and returns reaction descriptors.
- [src/input/render/renderer.js](src/input/render/renderer.js): Side effects; applies data attributes, updates [src/state/swipeState.js](src/state/swipeState.js), dispatches reaction events to Vue/consumers.
- State inputs: [src/state/domState.js](src/state/domState.js) supplies device/scale; [src/state/swipeState.js](src/state/swipeState.js) holds lane offsets, counts, and thresholds.

## Ownership Mapping
- Mechanics (delta, axis, direction): [src/input/engine/intentEngine.js](src/input/engine/intentEngine.js).
- Intent resolution and reaction eligibility: [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js) with [src/input/dom/domRegistry.js](src/input/dom/domRegistry.js).
- Threshold sizing: [src/state/swipeState.js](src/state/swipeState.js) plus viewport scale from [src/state/domState.js](src/state/domState.js).
- Effects and state mutation: [src/input/render/renderer.js](src/input/render/renderer.js).

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
