# Gesture Input Action Plan

## Highest-Risk Fixes (do first)
- Normalize pointer → scaled space before math. `computeSwipeDelta` currently treats `raw` as already scaled (`scaledRaw` mirrors `raw`) while clamps use scaled axis sizes [src/input/render/reactionSwipe.js#L22-L65]. Convert raw viewport coords to the same scaled space as lane bases (e.g., divide by `scale.value` or pre-scale drag bases), and emit early warnings when `scale.value` is 0/NaN.
- Remove double-application of deltas by basing swipe math on per-gesture snapshots, not live renderer offsets. `buildSwipeBase` feeds `lane.offset` into both swipe and commit calculations [src/input/render/reactionResolver.js#L45-L96], while the renderer also applies the resulting deltas, causing totals to be added twice (carousel/slider flyaways). Capture `startOffset = lane.committedOffset` (or a dedicated snapshot) at swipeStart and use that for all delta/commit math.
- Fix slider/carousel commit bases. Commit math reuses the mutated `lane.offset` via `buildSwipeBase` [src/input/render/reactionResolver.js#L313-L333], so commit deltas get stacked on top of already-applied offsets. Compute commit deltas against the original committed offset, then let the renderer persist.

## Drag-Specific Corrections
- Align drag bases with scaled input. Drag delta math mixes unscaled pointer coords with scaled clamp bounds [src/input/render/reactionSwipe.js#L22-L65] and renderer-held bases. Decide one space (scaled CSS px) and convert both raw pointers and drag bases into it before clamping.
- Harden 2D clamp inputs. Guard `clampDelta2D` against undefined/NaN parent sizes and log when drag bases are missing to avoid silent drops.

## Lane/Threshold Policy
- Abort swipeStart/commit when lane size is unknown. `shouldStartSwipe`/`shouldCommitSwipe` allow slider/drag even if `lane.size` is 0, leading to division-by-zero clamps. Add guards and debug logs in resolver before emitting swipe descriptors [src/input/render/reactionResolver.js#L232-L365].
- Ensure carousel uses committed offsets for clamping. Clamp against `{ committedOffset, size }` rather than transient offsets to keep revert/commit symmetric.

## Scaling & Device Data
- Validate `window.__DEVICE` / `APP_SETTINGS.rawPhoneValues` at startup and log missing density/size fields [src/state/sizeState.js#L9-L40]. Consider freezing the resolved device object to prevent accidental mutation.
- Use `normalizeSwipeDelta` or remove it; it is currently unused, so deltas remain in mixed units [src/state/sizeState.js#L9-L43].

## Debuggability
- Add structured logs/guards for NaN/Infinity deltas and zero scale before calling `clampSwipe` and before dispatching descriptors in resolver/renderer.
- Emit a one-time warning when `getDragBase` is missing during drag frames/commit, then clear the gesture to avoid corrupted persistence.

## Ordering
1) Align coordinate spaces (scale normalization for drag + axis swipes).
2) Snapshot correct bases at swipeStart and refactor resolver to use snapshots for swipe/commit.
3) Adjust clamp inputs (lane size/committed offsets) and add guards/logging.
4) Re-test Web + APK with varied densities to confirm deltas, clamping, and commit/revert symmetry.
