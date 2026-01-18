# Gesture Data Flow

1) Platform input → intentEngine
- inputRouter normalizes pointer events to (x, y) and calls intentEngine onDown/onMove/onUp.
- intentEngine detects axis, accumulates scalar delta along the locked axis, and emits intent callbacks to engineAdapter.

2) Policy/bridge → reaction resolution
- engineAdapter forwards intents to reactionResolver.
- For drag swipeTypes, engineAdapter tracks gesture start (x,y) and injects `rawDelta: { x: currentX - startX, y: currentY - startY }` into swipe and swipeCommit intents.
- reactionResolver resolves intent to reaction descriptors (press/swipe/select), choosing numeric deltas for axis-locked swipeTypes and `{x,y}` deltas for drag when `rawDelta` exists.

3) Renderer side-effects
- renderer receives descriptors only from engineAdapter and is the sole DOM/carouselState mutator.
- Numeric deltas (carousel/slider) update carouselState offsets. Slider persists `committedOffset`; carousel animates via pendingDir.
- Drag descriptors are not written to carouselState; renderer derives `absolute = base + delta` using a WeakMap of per-element positions and attaches it to the dispatched descriptor.
- Renderer dispatches `CustomEvent('reaction', { detail: descriptor })` to the target element.

4) Vue/component consumption
- Components listen for `reaction` events on their gesture elements.
- Components do not compute gesture math; they apply transforms using `detail.absolute` when present, otherwise `detail.delta`.
- Components never mutate carouselState; they are pure consumers of renderer outputs and CSS hooks.

Coordinate spaces and axes
- All coordinates (`x`, `y`, `raw`, `rawDelta`, `absolute`) are viewport client pixels.
- `delta` for axis-locked types is a scalar along the detected axis.
- `delta`/`absolute` for drag types are `{x, y}` displacements from gesture start, in viewport space.
