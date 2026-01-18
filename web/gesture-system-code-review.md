# Gesture System Code Review

## Executive Summary
Overall architecture matches the documented pipeline and keeps renderer as the main side-effect sink for carousel/slider. Key drag-path deviations: drag positions are mutated by both renderer and the SwipeDrag component, violating the contract and causing overshoot/double-counting risk. Renderer bases drag absolutes on gestureState that the component updates mid-gesture, blurring ownership. Other subsystems largely adhere to boundaries and data flow. Main risks: drag state ownership, component gesture math, and lack of explicit drag-base snapshotting in renderer.

## Contract Compliance Review
- ✅ inputRouter: Normalizes pointer events, no DOM/gesture logic.
- ✅ intentEngine: Pointer state machine only; no DOM or swipeType policy.
- ✅ engineAdapter: Pure bridge/forwarder; no DOM, no state.
- ✅ reactionResolver: Resolves intents via domRegistry, computes deltas via reactionSwipe; no DOM writes.
- ✅ reactionSwipe: Pure helpers; respects swipeType (drag uses rawDelta/raw delta).
- ⚠️ gestureState: Correct for lifecycle/raw deltas; dragPositions exposed globally without single-writer discipline.
- ⚠️ renderer: Proper for carousel/slider; for drag it reads gestureState and writes it on commit but lacks per-gesture base snapshot; relies on external (component) updates for base correctness.
- ❌ Vue Components (SwipeDrag): Performs gesture math (absolute = startPos + delta) and writes setDragPosition on every swipe frame; duplicates gesture state and violates “components do not compute gesture math or mutate gesture state.” SwipeCarousel/SwipeSlider comply (render-only).
- ✅ domRegistry: Read-only DOM discovery.
- ✅ sizeState / carouselState: Correct ownership; renderer-only mutations.

## Bugs & Risk Findings
- High: Multiple writers to dragPositions — SwipeDrag writes on every swipe, renderer writes on commit. Violates single-source ownership and causes overshoot when renderer also adds base+delta.
- High: Drag absolute computed in renderer uses getDragPosition (mutable by component) + cumulative delta → if component updates dragPositions mid-gesture, absolute drifts (double-add) and pointer tracking diverges.
- Medium: Renderer does not snapshot drag start base per gesture; re-reads gestureState each frame, making it sensitive to external mutations and mid-gesture state changes.
- Medium: Components performing gesture math risk divergence if contract changes (e.g., delta normalization), creating hidden coupling.
- Low: gestureState.resetGestureTracking does not clear dragPositions (intentional persistence) but leaves no per-gesture guard; acceptable yet worth documenting.

## State & Delta Analysis
- gestureState: start/last/active used only for rawDelta attachment; dragPositions intended as persisted absolute. Ownership blurred by component writes.
- Deltas: intentEngine emits scalar totalDelta; reactionSwipe converts to rawDelta for drag. Renderer assumes delta is total since gesture start. Commit reuses same delta. No normalization for drag (correct per contract).
- Hidden coupling: renderer’s drag absolute = gestureState dragPosition + delta; component mutates gestureState during move, so delta (from start) is added to an already advanced base, causing cumulative overshoot.
- Lane state: carouselState is renderer-only; sliders persist committedOffset; compliant.

## Renderer & Component Boundaries
- Renderer: Correctly mutates carouselState and data-*; for drag it enriches descriptor.absolute and writes dragPositions on commit. Lacks isolation from component mutations.
- Components: SwipeDrag breaks purity (gesture math + state writes). SwipeCarousel and SwipeSlider are pure consumers.

## Improvement Opportunities
- Single-writer for dragPositions: Make renderer the sole mutator; components should only read detail.absolute and never call setDragPosition.
- Snapshot drag base in renderer on swipeStart (store in a Map keyed by laneId or element) and use base + delta without rereading gestureState mid-gesture; write back on commit only. This removes double-add risk even if others read state.
- Update SwipeDrag to trust detail.absolute when present and avoid recomputing absolute/deltas; drop per-frame setDragPosition. Keep only a local display ref.
- Clarify in gestureContract that dragPositions are renderer-owned persistence and components must not write them.
- Add lightweight assertions/logs in renderer for drag when gestureState.swipeType !== 'drag' but descriptor.swipeType === 'drag' (sanity guard).

## Final Verdict
Conditionally safe for carousel/slider; fragile for drag due to state ownership violations and component-side gesture math. Fixing drag ownership (renderer as single writer, component read-only) will restore contract adherence and remove overshoot risk without large redesign.
