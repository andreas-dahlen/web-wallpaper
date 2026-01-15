# Code Review

## Separation and Ownership
- intentEngine stays math-only and delegates decisions to adapter/resolver; adapter forwards without DOM or branching ([src/input/engine/intentEngine.js](src/input/engine/intentEngine.js), [src/input/engine/engineAdapter.js](src/input/engine/engineAdapter.js)).
- reactionResolver owns DOM-derived intent resolution via domRegistry and sizing via domState/swipeState ([src/input/render/reactionResolver.js](src/input/render/reactionResolver.js)), while renderer remains the sole mutator of attributes and swipeState ([src/input/render/renderer.js](src/input/render/renderer.js)).

## Contracts and Descriptor Flow
- onSwipeStart returns a `cancel` descriptor when a press exists but does not also emit `swipe-start`; engineAdapter treats any truthy return as acceptance, so intentEngine enters SWIPING while renderer processes only a cancel ([src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L57-L96)). This sequencing mismatch can strand state between layers.
- cancel emitted from onSwipeStart is based on the currentTarget press state; currentTarget remains set, so subsequent drag/end operate on a target that just received cancel, which can be confusing for consumers relying on press/swipe exclusivity.
- onDrag rescales deltas conditionally based on platform state (window.__DEVICE vs web scaling) before returning the descriptor ([src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L98-L119)), embedding platform normalization into resolver instead of upstream math.

## Platform/DOM Boundary
- window.__DEVICE check inside reactionResolver is platform branching in a layer meant to stay platform-agnostic; scaling should be handled in domState or prior to resolver calls ([src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L98-L119)).

## Vocabulary / Naming Consistency
- Axis values mix `horizontal`/`vertical` (intentEngine) with `x`/`y` fallback in axisSize; ensure callers and state use a single vocabulary to avoid silent fallbacks ([src/input/render/reactionResolver.js](src/input/render/reactionResolver.js#L35-L55)).

## Potential Pitfalls Around Press → Cancel → Swipe
- Because onSwipeStart can emit only a cancel and still return truthy, renderer clears swiping/pressed while intentEngine moves to SWIPING; subsequent swipes may animate against a target that no longer carries swiping attributes.
- currentTarget is cleared only on swipe-end/cancel/release; if cancel returned from onSwipeStart is treated as acceptance, currentTarget persists through the swipe, which may produce mixed signals for consumers listening to reaction events.

future plan.... ====

Difficulty & Risk Ranking (low → high)
🟢 Tier 1 — Low risk, high clarity (DO FIRST)

These are mostly semantic + plumbing changes.

Remove onSwipeRelease everywhere

EngineAdapter

Resolver

Renderer

InputElement emits
👉 Pure deletion + rename adjustments

Lock event vocabulary

press

pressRelease

pressCancel

swipeStart

swipe

swipeCommit

swipeRevert

Rename handlers for symmetry

onDrag → onSwipe

onSwipeEnd → split into commit/revert

onGestureStart → onPress

💡 These give you mental stability before touching logic.

🟡 Tier 2 — Medium risk, structural but local

These change behavior, but not architecture.

Enforce “release only valid if elementFromPoint matches”

Resolver-only logic

Fallback → pressCancel

Introduce selected / deselected semantics

Resolver emits

Renderer applies classes / attrs

No engine involvement

Selection updates during swipe (elementFromPoint loop)

Throttled / RAF

No ownership changes

Visual only

💡 At this stage, things may feel “different” but not broken.

🟠 Tier 3 — Higher risk, core data changes

These touch the gesture core, so timing matters.

Track full XY deltas in engine

Add { x, y }

Keep axis-locked delta intact

Do not break existing swipe math

Split raw vs resolved movement

Resolver consumes both

Renderer chooses which to use per intent

💡 This enables drag & drop, swipeMove, etc — but should be isolated.

🔴 Tier 4 — Optional / Experimental (DO LAST)

Only once everything else feels solid.

SwipeMove intent

Separate from swipe navigation

Likely new intent type

Swipe ownership reversion (cancel back to press)

Complex state restoration

Easy to get edge-case bugs

🧠 These are cool, but not required for correctness.

2️⃣ Why this order works
Key principle:

Stabilize vocabulary → stabilize flow → expand capability

If you:

change semantics after adding XY movement → confusion

add selection logic before fixing cancel rules → bugs

do everything at once → 🧨

Tier 1 makes everything readable
Tier 2 makes everything predictable
Tier 3 makes everything powerful