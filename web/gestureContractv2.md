Gesture System Contract (Refactored)
Design Goals

Keep sliders/carousels on simple 1D delta flow; drags remain 2D with last-known absolute position.

Maintain a single platform-agnostic pipeline (Web + Android WebView) with consistent semantics.

Enforce strict module boundaries: state tracking, math, descriptors, and rendering are separated.

Components and Vue remain render-only; math resides in math/, engine, resolver, or renderer helpers.

All data flows as object payloads, not positional arguments.

Authoritative Data Flow

inputRouter: normalizes platform events → intentEngine.

intentEngine: detects axis, accumulates numeric deltas, calls engineAdapter.

engineAdapter: invokes reactionResolver; resolver reads domRegistry, carouselState, gestureState, and delegates math to math/ (e.g., swipeMath.js, clampMath.js).

renderer: consumes reaction descriptors, applies offsets/translate, persists drag/slider/carousel state, dispatches CustomEvent('reaction').

Vue components: render-only consumers of dispatched reactions.

Module Responsibilities
Module	Do	Must Not
inputRouter	Forward raw pointer objects; normalize coordinates	Touch DOM, renderer, or perform math
intentEngine	State machine, track numeric deltas, detect intent, call adapter	Clamp values, access DOM, or mutate targets
engineAdapter	Bridge to resolver/renderer, send object payloads	Store state or mutate descriptors
domRegistry	Read data-* intent metadata	Mutate DOM
reactionResolver	Skeleton delegator: build descriptors, forward drag/carousel/slider math to math/, attach gestureState info	Mutate DOM or state directly
reactionSwipe / math/swipe*.js	Pure delta, commit, and clamp math	Mutate payload or state
gestureBounds / math/clampMath.js	Pure clamp math for deltas, bounds, swipe ranges	Track lifecycle or DOM
gestureState	Track lifecycle: active/start/last/swipeType; per-key drag positions	Mutate by components or DOM
carouselState	Track lane offsets, committed offsets, sizes	Mutate outside renderer
renderer	Apply deltas, persist drag/offset positions, set data-* flags	Alter semantic descriptor fields
sizeState	Expose device and scale; provide getAxisSize	Store gesture positions
Coordinate Spaces & Scaling

All math in scaled CSS pixels: device CSS size × sizeState.scale.

Pointer coords entering resolver / gestureState must be scaled.

Drag last-known positions and carousel offsets share this space.

APK/Web may inject device density; invalid payloads fall back safely.

Gesture Lifecycle

Press: onDown → engineAdapter.onPress → resolver emits press/select → renderer sets data-pressed.

Swipe Start: axis lock in intentEngine → adapter call → resolver emits swipeStart → snapshot numeric bases for slider/carousel; drags rely on last-known positions.

Swipe Update: intentEngine sends total delta → resolver attaches drag delta → delegates to math/ for clamped delta → renderer applies delta → dispatch reaction.

Swipe Commit: intentEngine onUp → resolver computes commit delta → renderer persists drag positions or slider/carousel offset.

Swipe Revert: carousel only.

Press Release: onUp without swipe → pressRelease descriptor.

Reaction Descriptor Contract
{
  type: string,            // e.g., press, swipe, swipeCommit, swipeRevert, pressRelease, select, deselect
  element?: HTMLElement,
  laneId?: string,
  axis?: 'x' | 'y',
  direction?: 'left'|'right'|'up'|'down',
  delta?: number,
  actionId?: string,
  swipeType?: 'drag'|'slider'|'carousel',
  laneDirection?: 'x'|'y',
  commitStrategy?: string,
  normalized?: number,
  normalizedPercent?: number,
  absolute?: {x:number, y:number},
  dragKey?: string,
  raw?: {x:number, y:number}
}


Slider/carousel deltas: numeric

Drag deltas: {x, y}; renderer may attach absolute

Resolver emits already-clamped deltas; renderer does not modify values except to persist drag or offsets

Swipe Type Semantics
Type	Dim	Base	Commit/Revert
Carousel	1D numeric	committed offset	may commit/revert
Slider	1D numeric	lane offset	commit only, never revert
Drag	2D	last-known absolute	persists lastKnown positions
State Ownership & Mutation Rules

Renderer is sole writer of carouselState and dragPositions persistence.

gestureState lifecycle and drag keys are written only via resolver/intent helpers.

reactionResolver and reactionSwipe / math files stay pure.

Lanes must exist with sizes before swipe commit; missing size → abort swipe.

Forbidden Patterns

No DOM mutations in engine, resolver, gestureState, carouselState, or math files.

Never mix unscaled and scaled coordinates.

gestureState drag positions cannot be written by components.

Emit absolute positions only for drags, never for sliders/carousels upstream of renderer.

Non-Negotiable Invariants

All deltas are clamped before renderer.

carouselState stores numeric offsets only.

Drag persistence happens on commit; lastKnown positions are the base for next drag.

All data-* lanes must have direction + swipeType metadata.