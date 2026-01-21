# Gesture System Contract

## Design Goals
- Single, platform-agnostic pipeline (Web + Android WebView) with identical semantics.
- Declarative reactions: input → intents → reaction descriptors → renderer side-effects → Vue rendering only.
- Strict module boundaries and single-writer ownership for every piece of state.
- Components are render-only; all gesture math, clamping, and policy live in engine/resolver/swipe helpers/renderer.

## Authoritative Data Flow
1) inputRouter normalizes platform events and forwards (x, y) to intentEngine.
2) intentEngine detects axis, keeps numeric total delta (no clamping), and calls engineAdapter hooks.
3) engineAdapter calls reactionResolver; resolver uses domRegistry hits, carouselState lane metadata, gestureState payloads, and reactionSwipe (which calls gestureBounds) to build descriptors.
4) renderer consumes descriptors, mutates DOM + carouselState, derives drag absolute positions, and dispatches CustomEvent('reaction').
5) Vue components listen and render only; no gesture math or state mutation.

## Module Responsibilities (Do / Must Not)
- inputRouter: DO register platform listeners and forward coords; MUST NOT touch DOM/renderer/Vue or do math.
- intentEngine: DO pointer state machine (phase, axis lock, numeric total delta); MUST NOT query DOM, know swipeType policy, clamp, or emit absolute.
- engineAdapter: DO bridge engine → resolver → renderer and expose policy hooks; MUST NOT store state, access DOM, or alter descriptors.
- domRegistry: DO read data-* for lane/action/intent metadata; MUST NOT mutate DOM or decide policy.
- reactionResolver: DO build descriptors, pull lane bases/size from carouselState, pull drag payloads from gestureState, call reactionSwipe for all delta math/clamping; MUST NOT mutate DOM/state or add absolute.
- reactionSwipe: DO pure delta computation per swipeType, clamped via gestureBounds; MUST NOT mutate payload/state or emit descriptors.
- gestureBounds: DO clamp numeric/2D deltas by swipeType and bounds; MUST stay pure.
- gestureState: DO track lifecycle (active/start/last/swipeType) and attach rawDelta for drag only; hold dragPositions for persistence (renderer-owned); MUST NOT be mutated by components or perform policy/DOM.
- carouselState: DO own lane bases (index, offset, committedOffset, size, count, dragging, pendingDir) and thresholds; renderer is sole mutator; MUST NOT be touched by components/engine/resolver.
- renderer: DO consume descriptors, set data-* flags, mutate carouselState, compute drag absolute from renderer-held/snapshotted bases, dispatch reaction events; MUST NOT change semantic descriptor fields or depend on component state.
- Vue components (SwipeCarousel/Slider/Drag/etc.): DO listen to reaction events and render transforms/styles; MUST NOT compute gesture math, clamp, or mutate gestureState/carouselState (SwipeDrag must not call setDragPosition during gesture frames).

## Gesture Lifecycle (canonical)
- Press: intentEngine.onDown → adapter.onPress → resolver emits press/select → renderer sets data-pressed and dispatches.
- Swipe start: intentEngine detects axis, asks shouldStartSwipe → adapter.onSwipeStart → resolver emits swipeStart with raw coords → renderer sets dragging/data-swiping and snapshots bases (including drag base).
- Swipe update: intentEngine emits numeric total delta → adapter.onSwipe → resolver adds rawDelta for drag only → reactionSwipe clamps via gestureBounds → descriptor carries clamped delta → renderer applies lane offset (carousel/slider) or drag absolute (base snapshot + clamped delta) → dispatch.
- Swipe commit: intentEngine onUp calls shouldCommitSwipe → adapter.onSwipeCommit → resolver computes clamped commit delta via reactionSwipe → renderer commits (carousel/slider) or persists drag position; renderer may add absolute for drag only.
- Swipe revert: allowed only for carousel; resolver emits swipeRevert; renderer clears pendingDir/dragging/data-swiping.
- Press release (no swipe): intentEngine onUp → adapter.onPressRelease → resolver emits pressRelease; renderer clears data-pressed.

## Reaction Descriptor Contract
- Shape (immutable before renderer): { type, element?, laneId?, axis?, direction?, delta?, actionId?, swipeType?, laneDirection?, commitStrategy?, raw?, rawDelta?, normalized?, normalizedPercent? }.
- Required: press/pressRelease/pressCancel need type + element; swipeStart needs laneId/axis/element/swipeType/direction; swipe/swipeCommit need laneId/axis/delta/element/swipeType/direction; swipeCommit also laneDirection; swipeRevert needs laneId/element/swipeType/laneDirection.
- Delta ownership: reactionSwipe computes all deltas post-clamp via gestureBounds; axis-locked deltas are numeric; drag deltas are {x,y}.
- raw/rawDelta are viewport pixels from engine/gestureState; no upstream absolute positions.
- Renderer may add read-only absolute (drag only) and may forward normalized fields from reactionSwipe for slider; renderer must not alter delta/type/direction/swipeType.
- Descriptors are read-only to consumers (Vue).

## Swipe Type Semantics & Bases
- Carousel: axis-locked; may commit or revert; deltas numeric; bases from carouselState.offset/committedOffset/size; renderer mutates carouselState; no absolute field.
- Slider: axis-locked; never reverts; deltas numeric; clamped to lane size via gestureBounds; bases from carouselState; renderer persists committedOffset.
- Drag/Drag-and-drop: free {x,y}; never reverts; clamped to viewport via gestureBounds; bases are renderer-held snapshots of gestureState dragPositions; renderer adds absolute and writes persistence on commit only.
- Start/commit thresholds use carouselState size-based helpers unless swipeType is explicitly always-allow; slider/drag still clamp even if start/commit are permissive.

## State Ownership & Mutation Rules
- Renderer is sole writer of DOM data-* flags, carouselState offsets/commits/pendingDir, and dragPositions persistence.
- gestureState lifecycle fields are written by intentEngine/resolver helpers only; dragPositions writes occur in renderer; components have read-only access.
- reactionResolver emits descriptors only; no side-effects or DOM.
- reactionSwipe + gestureBounds own all clamping; no clamping elsewhere.
- Lanes must exist in carouselState before renderer applies offsets; lane size must be known before commit (otherwise reject/defer commit).
- No JS animation loops in gesture handling; timing/easing live in CSS/components.
- Only renderer dispatches CustomEvent('reaction'); no other module dispatches UI events.

## Forbidden Patterns
- Gesture math or clamping inside Vue components.
- DOM access in intentEngine, engineAdapter, reactionResolver, reactionSwipe, gestureBounds, gestureState, carouselState.
- Mutating gestureState.dragPositions outside renderer commit path; writing non-numeric offsets to carouselState.
- Emitting swipeRevert for slider/drag; calling renderer outside engineAdapter; emitting absolute upstream of renderer; mutating descriptors after dispatch.

## Non-Negotiable Invariants
- reactionResolver is side-effect free; renderer is the sole side-effect sink.
- All deltas are clamped in reactionSwipe via gestureBounds before reaching renderer.
- carouselState stores numeric offsets only; drag offsets never stored there.
- Drag absolute is renderer-derived (base snapshot + clamped delta) and dispatched read-only.
- Slider/drag swipeTypes never revert; carousel may commit or revert only when size is known.
- data-* lanes require direction + swipeType; missing metadata invalidates swipe intent.
- gestureState tracks pointer lifecycle; no other module mutates lifecycle fields.
- Components are render-only consumers of reaction events and CSS hooks.
