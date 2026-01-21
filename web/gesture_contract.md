# Gesture System Contract (Simplified)

## Design Goals
- Keep sliders/carousels on simple 1D delta flow; make drags 2D using last-known absolute position.
- Maintain single, platform-agnostic pipeline (Web + Android WebView) with shared semantics.
- Preserve strict module boundaries and single-writer rules for state.
- Components remain render-only; math stays in engine/resolver/swipe helpers/renderer.

## Authoritative Data Flow
1) inputRouter normalizes platform events → intentEngine.
2) intentEngine detects axis, tracks numeric total delta, calls engineAdapter.
3) engineAdapter invokes reactionResolver; resolver reads domRegistry, carouselState, gestureState, and calls reactionSwipe/gestureBounds for clamped deltas.
4) renderer consumes descriptors, mutates carouselState + drag persistence, dispatches CustomEvent('reaction').
5) Vue components render from events only.

## Module Responsibilities (Do / Must Not)
- inputRouter: DO forward raw coords; MUST NOT touch DOM/renderer or do math.
- intentEngine: DO state machine + numeric totals; MUST NOT clamp or access DOM/policy.
- engineAdapter: DO bridge to resolver/renderer; MUST NOT mutate descriptors or store state.
- domRegistry: DO read data-* intent metadata; MUST NOT mutate DOM.
- reactionResolver: DO build descriptors, use gestureState for drag deltas, carouselState for lane bases, reactionSwipe for clamping; MUST NOT mutate DOM/state.
- reactionSwipe: DO pure delta/clamp math; MUST NOT mutate payload/state.
- gestureBounds: DO clamp deltas by type/bounds; stay pure.
- gestureState: DO track lifecycle (active/start/last/swipeType) and per-key last-known drag positions; DO expose optional locks; MUST NOT be mutated by components/DOM.
- carouselState: DO own lane offsets/commits/sizes; renderer is sole mutator.
- renderer: DO apply deltas (translate/offset), set data-* flags, persist drag positions on commit; MUST NOT alter semantic descriptor fields.
- sizeState: DO expose device + scale; MUST NOT store gesture data.
- Vue components: render-only consumers of reaction events and CSS hooks.

## Coordinate Spaces & Scaling
- All math in scaled CSS pixels: device CSS size × sizeState.scale.
- Pointer coords entering resolver/gestureState must be in the same scaled space; clamps use sizeState.getAxisSize.
- Drag last-known positions and carousel offsets share this space; avoid mixing density pixels or unscaled viewport units.
- APK injects window.__DEVICE; Web falls back to APP_SETTINGS.rawPhoneValues/density. Invalid payloads fall back with a log.

## Gesture Lifecycle (canonical)
- Press: onDown → adapter.onPress → resolver emits press/select → renderer sets data-pressed.
- Swipe start: intentEngine axis lock → adapter.onSwipeStart → resolver emits swipeStart; for slider/carousel snapshot numeric bases; drags rely on last-known position only.
- Swipe update: intentEngine sends total delta → resolver attaches drag delta (2D: (current-start)+lastKnown) or passes numeric for slider/carousel → reactionSwipe clamps → renderer applies offset/translate and dispatches reaction.
- Swipe commit: intentEngine onUp → resolver computes commit delta (same bases) → renderer persists drag position (2D absolute) or commits slider/carousel offset.
- Swipe revert: carousel only.
- Press release: onUp without swipe → pressRelease.

## Reaction Descriptor Contract
- Shape: { type, element?, laneId?, axis?, direction?, delta?, actionId?, swipeType?, laneDirection?, commitStrategy?, normalized?, normalizedPercent?, absolute?, dragKey? }.
- Deltas: numeric for slider/carousel; {x,y} (and optional absolute) for drag.
- Resolver supplies already-clamped deltas; renderer may add read-only absolute for drags if needed.

## Swipe Type Semantics & Bases
- Carousel: 1D numeric; bases from committed offsets; may commit/revert.
- Slider: 1D numeric; clamped to lane size; commits offset; never reverts.
- Drag: 2D; delta = (current-start)+lastKnown; lastKnown persists on commit; future hooks may lock or snap.

## State Ownership & Mutation Rules
- Renderer is sole writer of carouselState and dragPositions persistence.
- gestureState lifecycle and drag keys are written via resolver/intent helpers only.
- reactionResolver is side-effect free; reactionSwipe/gestureBounds stay pure.
- Lanes must exist with size before swipe commit; missing size aborts swipe.

## Forbidden Patterns
- DOM mutations in engine/resolver/gesture/state files.
- Mixing unscaled coords with scaled bases.
- Writing gestureState.dragPositions from components.
- Emitting absolute upstream of renderer for non-drag types.

## Non-Negotiable Invariants
- All deltas are clamped before renderer.
- carouselState stores numeric offsets only.
- Drag persistence happens on commit; lastKnown positions are the base for the next drag.
- data-* lanes require direction + swipeType metadata.
