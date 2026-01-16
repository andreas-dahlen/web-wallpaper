# Gesture Data Flow

1) Platform input → intentEngine
- inputRouter normalizes pointer events to (x, y) and calls intentEngine onDown/onMove/onUp.
- intentEngine detects axis, accumulates scalar delta along the locked axis, and emits intent callbacks to engineAdapter.

2) Policy/bridge → reaction resolution
- engineAdapter forwards intents to reactionResolver.
- swipeState tracks gesture start/last/axis/base positions during swipeStart; resolver derives deltas (numeric for axis-locked, `{x,y}` for drag) using that gesture state and clamps them to lane sizes/bounds (sizeState scaling for axis deltas).
- reactionResolver resolves intent to reaction descriptors (press/swipe/select), choosing numeric deltas for axis-locked swipeTypes and `{x,y}` deltas for drag, already clamped before renderer.

3) Renderer side-effects
- renderer receives descriptors only from engineAdapter and is the sole DOM/swipeState mutator.
- Renderer measures lane metrics from descriptor.element (size/bounds/direction; lane count via data-lane-count) on swipeStart/commit before applying state changes.
- Numeric deltas (carousel/slider) update swipeState offsets. Slider persists `committedOffset`; carousel animates via pendingDir and renderer finalizes index/reset on transitionend.
- Drag descriptors update swipeState dragPosition; renderer derives `absolute = dragPosition + delta` and attaches it to the dispatched descriptor. Slider swipe adds `absolute = committedOffset + delta` for convenience.
- !!Drag absolute is ephemeral during swipe and persisted to swipeState.dragPosition only on swipeCommit!!For sliders, absolute is a derived convenience value; committedOffset remains the sole persisted state.!!
- Renderer dispatches `CustomEvent('reaction', { detail: descriptor })` to the target element.

4) Vue/component consumption
- Components listen for `reaction` events on their gesture elements.
- Components do not compute gesture math; they apply transforms using `detail.absolute` when present, otherwise `detail.delta`.
- Components never mutate swipeState; they are pure consumers of renderer outputs and CSS hooks.

Coordinate spaces and axes
- All coordinates (`x`, `y`, `raw`, `rawDelta`, `absolute`) are viewport client pixels.
- `delta` for axis-locked types is a scalar along the detected axis.
- `delta`/`absolute` for drag types are `{x, y}` displacements from gesture start, in viewport space.
