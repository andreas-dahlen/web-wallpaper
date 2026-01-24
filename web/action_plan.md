# Action Plan (Gesture Contract Review)

## Detected Issues / Bugs
- Swipe delta is never clamped; `reactionResolver` forwards raw totals and `renderer` applies them directly, so sliders/carousels can overshoot bounds and drag gestures ignore container limits ([src/input/render/reactionResolver.js](src/input/render/reactionResolver.js), [src/input/render/renderer.js](src/input/render/renderer.js)).
- Drag persistence stores the streamed delta verbatim; it never adds the last-known drag position from `gestureState`, so subsequent drags lose accumulated position and commits may jump ([src/input/render/reactionResolver.js](src/input/render/reactionResolver.js), [src/state/gestureState.js](src/state/gestureState.js)).
- Carousel reverts reset lane offset to `0` instead of restoring the committed offset, so non-zero committed lanes snap to the origin on revert ([src/input/render/renderer.js](src/input/render/renderer.js)).
- Commit/revert choice ignores swipe distance/ratio; resolver decides purely on declared reactions, so carousels can commit with tiny movement and sliders never revert based on thresholds ([src/input/render/reactionResolver.js](src/input/render/reactionResolver.js)).
- Swipe threshold is effectively disabled because `swipeThresholdCalc` always returns `true`, so even tiny moves trigger swipeStart ([src/input/math/clampMath.js](src/input/math/clampMath.js)).

## Suggested Fixes
- Run deltas through clamp math (`computeSwipeDelta`/`clampSwipe`) in resolver before emitting descriptors; feed renderer only clamped values.
- For drags, build absolute positions using `gestureState.getDragPosition(dragKey)` as base + shaped delta, and persist that absolute on commit.
- On carousel revert, restore `committedOffset` instead of zeroing the lane; on commit use direction + clamped delta to update pending offsets.
- Reintroduce distance/size-based acceptance and commit thresholds (`shouldStartSwipeBySize`/`shouldCommitSwipeBySize`) driven by lane size and app settings.
- Gate `swipeStart` emission by declared reactions to avoid firing for unsupported targets.

## Module Recommendations
- **reactionResolver**: integrate clamp math, build drag absolutes from state, and include direction based on clamped deltas; ensure swipeStart respects `supports('swipeStart')`.
- **renderer**: treat drag `delta` as an absolute position after resolver computes it; use committed offsets on revert; avoid mutating lane state when descriptor lacks laneId.
- **intentEngine**: apply start-threshold before invoking adapter; keep delta shaping but drop legacy `totalDelta` once downstream consumers migrate.
- **domRegistry**: consider caching lane metadata to avoid repeated `elementsFromPoint` scans during swipeStart.

## Contract Gaps
- No clamping or thresholding currently enforces the simplified contract’s expectation of bounded deltas.
- Drag persistence semantics (absolute vs. delta) are underspecified in code; resolver/renderer must agree on using absolute positions without reintroducing removed `absolute` fields.
- Carousel commit/revert semantics still rely on renderer-side heuristics rather than contract-driven descriptors (e.g., commitStrategy removal).
