# Architecture Review

## Issues

- [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L156-L188) — `shouldStartSwipe` / `shouldCommitSwipe`
  - Leak: gesture mechanics emit `horizontal` / `vertical`, but the fallback threshold logic expects `x` / `y`, so viewport-based thresholds never run when no lane is resolved.
  - Problem: non-lane gestures cannot start or commit via size-based thresholds, and the axis contract is ambiguous between layers.
  - Small fix: normalize axes to a single vocabulary before sizing (e.g., map `horizontal` → width and `vertical` → height inside the resolver or adapter) so fallback thresholds execute.

- [src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L73-L93) — `onSwipeStart`
  - Leak: when the lane is resolved via `findLaneByAxis`, the lane id is set but `reactions` stay from the original element, so `supports('swipeStart')` can stay false even though the lane declares swipe.
  - Problem: intent resolution depends on the down-target instead of the lane that owns the swipe, causing legitimate lane swipes on nested children to be rejected.
  - Small fix: when adopting a lane (fallback path), refresh the reactions from that lane’s declaration (e.g., reuse `domRegistry.findIntentAt` or copy a minimal swipe-capable reaction set) before evaluating support.

## Things that are already good and should not change
- Clear separation between gesture mechanics (`intentEngine`) and DOM/intent lookup (`reactionResolver` + `domRegistry`).
- Threshold calculations live in `swipeState`, keeping ratios centralized and shared across renderers.
- Lanes expose size via `SwipeCarousel`, giving the resolver concrete data for commit/start checks.
