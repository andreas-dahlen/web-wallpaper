# Gesture System Review (Jan 2026)

## Bugs
- Slider normalization is computed but never emitted to consumers; `computeSliderDelta` attaches `normalized`/`normalizedPercent` to the payload, yet `reactionResolver.onSwipe`/`onSwipeCommit` only forward the clamped numeric delta. Slider listeners cannot observe normalized progress. See [src/input/render/reactionSwipe.js](src/input/render/reactionSwipe.js#L38-L69) and [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L229-L274).
- Drag swipes are dropped when a drag base is missing; `renderer.handleSwipe` returns early if `dragBases` lacks an entry, so a missed `swipeStart` or lane mismatch silently loses `swipe` events. See [src/input/render/renderer.js](src/input/render/renderer.js#L46-L94).
- Start/commit thresholds are bypassed for slider/drag; `shouldStartSwipe/shouldCommitSwipe` return `true` for these types regardless of delta, so even a 1px move commits. This may be intended but differs from size-based thresholding used for carousels. See [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L335-L355).

## Risks
- `computeSliderDelta` mutates the incoming payload despite being treated as a pure helper; future reuse of the payload could leak normalization fields. See [src/input/render/reactionSwipe.js](src/input/render/reactionSwipe.js#L38-L69).
- `attachDragRawDelta` runs for every swipe type, attaching `rawDelta` to axis-locked gestures; downstream consumers could misinterpret these as drag payloads. See [src/state/gestureState.js](src/state/gestureState.js#L49-L86).
- Drag base caching lives in `renderer` (`dragBases` map) while persisted drag positions live in `gestureState`, creating split ownership that can desync if `renderer` is reset without `gestureState`. See [src/input/render/renderer.js](src/input/render/renderer.js#L15-L154).

## Redundancies
- `normalizeSwipeDelta` is exported but unused anywhere; safe to delete or wire into delta normalization. See [src/state/sizeState.js](src/state/sizeState.js#L45-L47).
- `engineAdapter.onPressCancel` only forwards its input and is never invoked by `intentEngine`; candidate for removal. See [src/input/engine/engineAdapter.js](src/input/engine/engineAdapter.js#L68-L72).

## Simplification Opportunities
- Emit slider normalization on descriptors (or remove normalization entirely) to keep `reactionSwipe` pure and make event payloads consistent. Touch [src/input/render/reactionSwipe.js](src/input/render/reactionSwipe.js#L38-L69) and [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L229-L274).
- Consolidate drag base ownership into `gestureState` to avoid dual sources (`dragBases` map vs persisted drag positions). See [src/input/render/renderer.js](src/input/render/renderer.js#L15-L154) and [src/state/gestureState.js](src/state/gestureState.js#L1-L103).
- Make start/commit thresholds configurable per swipeType instead of hard-coded always-allow for slider/drag; reuse `shouldStartSwipeBySize` / `shouldCommitSwipeBySize` when desired. See [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L335-L355).
- Remove payload mutation in `computeSliderDelta`; return derived values and let resolver build descriptors explicitly. See [src/input/render/reactionSwipe.js](src/input/render/reactionSwipe.js#L38-L69).

## Improvements / Refactors
- Surface commit strategy explicitly: if `commitStrategy` is meant to vary (carousel vs slider vs drag), encode policy centrally instead of implicit type checks in `renderer`. See [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L251-L274) and [src/input/render/renderer.js](src/input/render/renderer.js#L113-L168).
- Add assertions/logging for missing `dragBases` during drag swipes to prevent silent drops and to force lane metadata correctness. See [src/input/render/renderer.js](src/input/render/renderer.js#L83-L97).
- Consider emitting a dedicated drag absolute descriptor (or adding `absolute` earlier) so components need not depend on renderer-side base caches. See [src/input/render/renderer.js](src/input/render/renderer.js#L78-L111).

## Removals That Would Break Behavior
- Deleting the `dragBases` cache without moving base ownership into `gestureState` would break drag absolute calculations. See [src/input/render/renderer.js](src/input/render/renderer.js#L15-L154).
- Removing slider base snapshots would lose persistence across slider gestures; `gestureState.beginGestureTracking` seeds bases from committed offsets. See [src/state/gestureState.js](src/state/gestureState.js#L22-L47) and [src/input/render/renderer.js](src/input/render/renderer.js#L113-L146).
