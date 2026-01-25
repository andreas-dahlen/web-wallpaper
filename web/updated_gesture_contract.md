# Gesture Descriptor Contract (Simplified)

## Goals
- Single descriptor shape for all gestures with minimal fields.
- Keep math/DOM/state responsibilities isolated per module.
- Deltas come from the intent engine already axis-shaped (scalar when locked, {x,y} when free).
- Feedback exists only in adapter responses, never inside renderer/resolver descriptors.

## Descriptor Shape
```
{
  type: 'press' | 'pressRelease' | 'swipeStart' | 'swipe' | 'swipeCommit' | 'swipeRevert' | 'select' | 'deselect',
  element?: HTMLElement,          // DOM target
  laneId?: string,                 // slider/carousel lane id
  axis?: 'horizontal' | 'vertical' | 'both',
  direction?: 'left' | 'right' | 'up' | 'down',
  delta?: number | { x: number, y: number }, // scalar when axis locked; {x,y} when axis is both
  actionId?: string,
  swipeType?: 'drag' | 'slider' | 'carousel',
  dragKey?: string,
  feedback?: { accepted: boolean, lockAxis: boolean } // intentForwarder return only; never forwarded to renderer
}
```
Removed fields: raw, rawDelta, absolute, normalized, normalizedPercent, commitStrategy.

## Data Flow
1. `intentEngine` tracks pointer lifecycle, locks axis, and emits shaped `delta` (scalar if locked, {x,y} if free) to `intentForwarder`.
2. `intentForwarder` bridges to `reactionResolver`; forwards only descriptors, not feedback envelopes, to `renderer`.
3. `reactionResolver` resolves targets via `domRegistry`, builds contract-compliant descriptors, derives direction from delta, and never mutates DOM/state.
4. `renderer` applies deltas (drag persistence, lane offsets), sets `data-*` flags, and dispatches `CustomEvent('reaction', { detail })`.
5. Vue components listen to reactions only; they do not write gesture state.

## Lifecycle Rules
- **press**: on pointer down when target supports press/select.
- **swipeStart**: emitted after adapter acceptance; includes axis, swipeType, laneId/dragKey.
- **swipe**: streamed with shaped `delta` and `direction` derived from the latest delta.
- **swipeCommit**: on swipe end when commit is supported; includes last `direction` and final `delta`.
- **swipeRevert**: when commit not supported; same shape as commit.
- **pressRelease**: pointer up without swipe; includes context fields when available.
- **select/deselect**: selection lifecycle as declared by DOM data attributes.

## Delta & Axis Semantics
- Axis locked → `delta` is a single number for that axis.
- Axis free (`both`) → `delta` is `{ x, y }`.
- `direction` derives from the dominant/locked axis sign; `null` when no movement.
- Renderer never receives raw/absolute payloads; it operates only on `delta`, `axis`, `direction`, `swipeType`, and ids.

## Module Responsibilities
- **intentEngine**: pointer state, axis locking, shaped deltas; no DOM access or clamping.
- **intentForwarder**: forwards descriptors to `renderer`; only place that returns `feedback`.
- **domRegistry**: single DOM reader for data-* attributes; never mutates DOM.
- **reactionResolver**: builds descriptors using registry + state; delegates math/helpers; no DOM/state mutation.
- **reactionHelper/math**: pure helpers for delta shaping, direction resolution, and selection merging.
- **renderer**: applies deltas to `carouselState`/drag persistence, sets `data-*`, dispatches `reaction` events; does not change descriptor semantics.
- **state (gestureState/carouselState)**: sole sources of persisted gesture/carousel data, mutated only by renderer and state helpers.

## DOM & State Invariants
- No DOM mutations outside `renderer`.
- Deltas are clamped before render (math layer) when clamps are enabled.
- Drag persistence happens on commit using `dragKey`.
- Carousel/slider offsets stay numeric; drag coordinates stay 2D.
- Feedback never appears in renderer-facing descriptors.
