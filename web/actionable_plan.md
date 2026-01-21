# Actionable Plan (Gesture Contract Alignment)

## High Priority
- Clamp deltas centrally in reactionSwipe using gestureBounds for all swipe types (carousel passthrough, slider clamped to lane size, drag clamped to viewport) and stop mutating payloads; current helper only scale-normalizes and leaves deltas unbounded, violating the contract. Touch [src/input/render/reactionSwipe.js](src/input/render/reactionSwipe.js) and wire gestureBounds in [src/input/engine/gestureBounds.js](src/input/engine/gestureBounds.js).
- Restore start/commit gating for slider/drag instead of `swipeAlwaysAllowed`; use carouselState size thresholds or an explicit allowlist flag. Update [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js) shouldStartSwipe/shouldCommitSwipe branches.
- Feed reactionSwipe with lane bases and sizes when building descriptors so clamping/normalization use authoritative values. Pass carouselState offsets/committedOffset/size and drag base snapshots from gestureState into computeSwipeDelta/computeCommitDelta in [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js).
- Make renderer the sole writer of drag persistence and snapshot drag base on swipeStart; compute drag absolute from snapshot + clamped delta and write persistence only on commit. Add base map + guards in [src/input/render/renderer.js](src/input/render/renderer.js); stop reading live mutable dragPositions during move.
- Remove gesture math/state writes from SwipeDrag; consume renderer-added `detail.absolute` (or fallback delta) and keep position local-only. Stop calling setDragPosition in [src/components/SwipeDrag.vue](src/components/SwipeDrag.vue).

## Medium Priority
- Restrict gestureState dragPositions setter usage to renderer-only pathways; expose read-only getter for components. Harden API in [src/state/gestureState.js](src/state/gestureState.js).
- Surface slider normalization on descriptors explicitly (normalized/normalizedPercent) when clamping, without mutating inputs. Implement in reactionSwipe/reactionResolver and forward through renderer untouched.
- Add lane size readiness checks before commit/commit-revert decisions; if size missing, reject commit or defer. Place guards in [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js) and [src/input/render/renderer.js](src/input/render/renderer.js) using carouselState accessors.

## Low Priority
- Delete or repurpose unused normalizeSwipeDelta if gestureBounds covers all clamping; ensure sizeState exports remain focused on scaling inputs. See [src/state/sizeState.js](src/state/sizeState.js).
- Add lightweight logging/asserts for missing drag base snapshots to avoid silent drops. See [src/input/render/renderer.js](src/input/render/renderer.js).

## Suggested Fix Outline
- reactionSwipe: pure functions returning clamped deltas (and normalized for slider) using gestureBounds; no payload mutation.
- reactionResolver: gather lane bases/sizes and drag base snapshot, call reactionSwipe, emit descriptors with clamped delta only; keep descriptors immutable.
- renderer: snapshot drag base on swipeStart, derive absolute on swipe/swipeCommit, persist dragPositions on commit only; keep semantic fields untouched.
- components: render-only; SwipeDrag consumes dispatched absolute/delta and stops writing gestureState.
