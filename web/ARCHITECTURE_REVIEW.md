# Architecture Review

## Open Issue

## Things that are already good and should not change
- Clear separation between gesture mechanics (`intentEngine`) and DOM/intent lookup (`reactionResolver` + `domRegistry`).
- Threshold calculations live in `swipeState`, keeping ratios centralized and shared across renderers.
- Lanes expose size via `SwipeCarousel`, giving the resolver concrete data for commit/start checks.
