# Gesture System Contract (Refactored)

## Design Goals
- Keep sliders/carousels on simple 1D delta flow; drags stay 2D with last-known absolute positions.
- Maintain a single platform-agnostic pipeline (Web + Android WebView) with shared semantics.
- Enforce strict module boundaries: state tracks data, math lives in math/, renderer applies results, Vue components render only.
- All reactions use object payloads (no positional args) and flow through the same contract.

## Authoritative Data Flow
1. inputRouter normalizes platform events → intentEngine.
2. intentEngine detects axis, accumulates numeric deltas → engineAdapter.
3. engineAdapter calls reactionResolver; resolver reads domRegistry + state, delegates math to math/ via reactionSwipe.
4. renderer consumes reaction descriptors, applies offsets/translate, persists drag/slider/carousel state, dispatches CustomEvent('reaction').
5. Vue components are render-only consumers of dispatched reactions.

## Module Responsibilities (Do / Must Not)
- inputRouter: forward raw pointer objects; never touch DOM, renderer, or math.
- intentEngine: state machine, axis lock, numeric deltas; never clamp or access DOM/targets.
- engineAdapter: bridge to resolver/renderer; never mutate descriptors or state.
- domRegistry: read data-* intent metadata; never mutate DOM.
- reactionResolver: skeleton delegator that builds descriptors and forwards to math/; never mutate DOM or state directly.
- reactionSwipe (math): pure delta + clamp math; split across math/swipeDelta.js, math/swipeCommit.js, math/clampMath.js.
- gestureBounds: compatibility wrapper only; math lives in math/.
- gestureState: track lifecycle (active/start/last/swipeType) and per-key drag positions; never mutated by components/DOM.
- carouselState: track lane offsets, commits, sizes; renderer is the sole writer.
- sizeState: expose device + scale; no gesture data stored here.
- renderer: apply deltas, persist drag/offset positions, set data-* flags; never alter semantic descriptor fields.
- Vue components: render-only consumers of reaction events.

## Coordinate Spaces & Scaling
- All math uses scaled CSS pixels: device CSS size × sizeState.scale.
- Pointer coords entering resolver/gestureState are scaled; clamps use sizeState.getAxisSize.
- Drag last-known positions and carousel offsets share this space; no mixing of unscaled/physical pixels.
- APK/Web may inject device density; invalid payloads fall back safely with a log.

## Gesture Lifecycle
- Press: onDown → engineAdapter.onPress → resolver emits press/select → renderer sets data-pressed.
- Swipe start: axis lock in intentEngine → adapter.onSwipeStart → resolver emits swipeStart; slider/carousel snapshot numeric bases, drags use last-known positions.
- Swipe update: intentEngine sends total delta → resolver builds payload → math/clamp → renderer applies delta → dispatch reaction.
- Swipe commit: intentEngine onUp → resolver computes commit delta → renderer persists drag positions or slider/carousel offset.
- Swipe revert: carousel only (threshold-based commit vs revert from appSettings ratios).
- Press release: onUp without swipe → pressRelease descriptor.

## Reaction Descriptor Contract
```
{
  type: string,                          // 'press', 'pressRelease', 'swipe', 'swipeCommit', 'swipeRevert', 'select', 'deselect'
  element?: HTMLElement,                 // target DOM element
  laneId?: string,                       // for sliders/carousels
  axis?: 'horizontal' | 'vertical' | 'both',  // resolved swipe axis
  direction?: 'left' | 'right' | 'up' | 'down', // optional, for commits/reverts
  delta?: { x: number, y: number },     // cumulative movement from intentEngine
  actionId?: string,                     // optional for action elements
  swipeType?: 'drag' | 'slider' | 'carousel', // used by renderer to decide application
  dragKey?: string,                      // for drag persistence (2D drags)
  feedback?: {                           // only for engineAdapter
    accepted: boolean,
    lockAxis: boolean
  }
}
```
- Slider/carousel deltas are numeric; drag deltas are {x, y} with absolute positions for persistence.
- Resolver outputs clamped values; renderer does not modify deltas except to persist drag/offset state.

## Swipe Type Semantics
- Carousel: 1D numeric based on committed offset; may commit or revert by thresholds.
- Slider: 1D numeric based on lane offset; commits only (no revert).
- Drag: 2D absolute positions based on (start + totalDelta) + lastKnown; commit persists lastKnown.

## State Ownership & Mutation Rules
- Renderer is the sole writer of carouselState and drag position persistence.
- gestureState lifecycle and drag keys are written only via resolver/intent helpers.
- math files (clamp/swipe) stay pure; no DOM/state mutation.
- Lanes must exist with sizes before swipe commit; missing size aborts swipe.

## Forbidden Patterns
- DOM mutations inside engine/resolver/state/math.
- Mixing unscaled and scaled coordinates.
- gestureState drag positions written from components.
- Emitting absolute positions for sliders/carousels upstream of renderer.

## Non-Negotiable Invariants
- All deltas are clamped before renderer.
- carouselState stores numeric offsets only.
- Drag persistence happens on commit; lastKnown positions seed the next drag.
- data-* lanes require direction + swipeType metadata.
