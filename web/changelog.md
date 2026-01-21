# Gesture Refactor Changelog

## Summary
- Simplified drag handling: 2D deltas are now `(current - gestureStart) + lastKnown`, no WeakMaps or per-element snapshots.
- Unified last-known drag storage: single keyed map (`dragPositions`) keyed by `dragId` or `laneId`.
- Kept slider/carousel 1D swipe logic; numeric swipe bases remain via `swipeBases` snapshots.
- Added lightweight locking hooks (`lockDrag/unlockDrag/isDragLocked`) for future snapping/locking behaviors.
- Cleaned gesture contract to reflect simplified responsibilities and scaling rules.

## Files Touched
- Updated: `src/state/gestureState.js` (core gesture storage and drag delta computation).
- Updated: `src/input/render/reactionResolver.js` (consume new drag helpers).
- Updated: `gesture_contract.md` (documentation alignment).

## Behavioral Notes
- Drags use last-known absolute position; commits should persist via `setDragPosition` to prevent jumps on next gesture.
- Sliders/carousels continue using numeric deltas; lane size checks still gate swipe start/commit.
- Contract maintains scaled CSS pixel space; device/scale validation remains in sizeState.
