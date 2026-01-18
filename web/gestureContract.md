# Gesture Contract

## 1. Design Goals
- Platform-agnostic wiring: same intent path on Web and Android WebView.
- Declarative reactions: pointer input → descriptors → renderer side-effects.
- Deterministic, layered responsibilities to keep logic localized and testable.
- No UI components participate in gesture math or policy; they only render and listen.

## 2. Mental Model
Raw pointer events flow through a fixed pipeline (inputRouter → intentEngine → engineAdapter → reactionResolver → renderer), producing canonical reaction descriptors. gestureState tracks pointer lifecycle/raw deltas for drag, reactionSwipe computes swipe-type math, the renderer alone mutates DOM and shared swipe state, while Vue components react to dispatched events and CSS hooks without performing gesture logic.

## 3. Layer Responsibilities
### inputRouter.js
- Does: attach platform listeners, normalize events to (x, y), forward to intentEngine.
- Must not: query DOM, apply gesture logic, call renderer, talk to Vue.
- Allowed knowledge: platform flag, pointer coordinates.

### intentEngine.js
- Does: pointer state machine (phases, axis detection, delta accumulation), decides start/commit eligibility by querying adapter, emits intent callbacks.
- Must not: touch DOM, know lanes/components/swipeType, trigger renderer/CSS.
- Allowed knowledge: pointer math, timing, axis/delta values.

### engineAdapter.js
- Does: bridge intentEngine to reactionResolver, forward descriptors to renderer, host policy hooks (start/commit/revert eligibility).
- Must not: access DOM, animate, store state.
- Allowed knowledge: reactionResolver responses, renderer entry points.

### reactionResolver.js
- Does: resolve intent to reaction descriptors using domRegistry, carouselState sizing, sizeState metrics; delegate swipe math and type branching to reactionSwipe helpers; enforce reaction schema and swipeType eligibility.
- Must not: mutate DOM, mutate state, call renderer, dispatch events.
- Allowed knowledge: DOM structure via domRegistry, device/scale via sizeState, thresholds via carouselState.

### reactionSwipe.js
- Does: pure helpers to compute swipe/commit deltas and always-allow rules for swipe types; relies on normalizeSwipeDelta and provided payloads.
- Must not: touch DOM, mutate gestureState/carouselState, emit descriptors.
- Allowed knowledge: swipeType, payload deltas.

### gestureState.js
- Does: track pointer lifecycle (active flag, start/last coords, swipeType) and expose helpers to attach raw deltas for drag gestures.
- Must not: read DOM, decide policy, emit descriptors.
- Allowed knowledge: pointer coordinates, swipeType flags.

### renderer.js
- Does: apply side-effects from descriptors (set data-* flags, mutate carouselState offsets, dispatch CustomEvent('reaction')).
- Must not: perform gesture detection, intent logic, pointer math, platform logic.
- Allowed knowledge: carouselState structure, descriptor fields.

### domRegistry.js
- Does: read data-* to find lanes/actions/declared reactions, validate lane metadata (direction + swipeType).
- Must not: mutate DOM, trigger callbacks, apply logic beyond discovery.
- Allowed knowledge: document structure and dataset attributes.

### sizeState.js
- Does: provide viewport/device metrics and scaling helpers.
- Must not: store gesture state, mutate DOM.
- Allowed knowledge: window dimensions, injected device info.

### carouselState.js
- Does: hold lane state (size, offset, index, dragging, pendingDir), provide threshold helpers (start/commit by size).
- Must not: read DOM, decide gesture policy.
- Allowed knowledge: numeric offsets, sizes, thresholds.

### Vue Components
- Does: render visuals, listen to CustomEvent('reaction'), apply transforms/styles based on renderer-emitted state/events.
- Must not: compute gesture math, clamp offsets, decide commit/revert, mutate carouselState directly.
- Allowed knowledge: their own props/slots, reaction event payloads, CSS hooks.

## 4. Gesture Lifecycle
- Press: intentEngine.onDown → adapter.onPress → resolver emits press/select → renderer sets data-pressed and dispatches reaction.
- Swipe start: intentEngine detects axis and delta, asks adapter.shouldStartSwipe → adapter.onSwipeStart → resolver emits swipeStart → renderer sets dragging/data-swiping.
- Swipe update: intentEngine onMove emits swipe intent → adapter.onSwipe → resolver emits swipe → renderer applies lane offset (numeric only) and dispatches reaction.
- Swipe commit: intentEngine onUp calls adapter.shouldCommitSwipe → adapter.onSwipeCommit → resolver emits swipeCommit → renderer applies commit side-effect per swipeType and dispatches reaction.
- Swipe revert: intentEngine onUp calls adapter.shouldRevertSwipe, if allowed → adapter.onSwipeRevert → resolver emits swipeRevert → renderer reverts only carousel lanes.
- Release (no swipe): intentEngine onUp emits pressRelease → adapter → resolver emits pressRelease → renderer clears data-pressed and dispatches reaction.

flowchart LR
    inputRouter --> intentEngine --> engineAdapter --> reactionResolver --> renderer --> Vue
    intentEngine --> gestureState
    reactionResolver --> reactionSwipe
    renderer --> carouselState

## 5. Reaction Descriptor Contract
- Descriptors are plain data; renderer is the only consumer that mutates state/DOM.
- Shape: `{ type, element?, laneId?, axis?, direction?, delta?, actionId?, swipeType?, laneDirection?, commitStrategy? , raw? }`.
- Required per type:
  - press/pressRelease/pressCancel: `type`, `element`, optional `actionId`, `laneId`.
  - select/deselect: `type`, `element`.
  - swipeStart: `type`, `laneId`, `axis`, `element`, `swipeType`, `direction`, optional `raw`.
  - swipe: `type`, `laneId`, `axis`, `delta` (number for axis-locked; object for drag), `element`, `swipeType`, `direction`, `raw`.
  - swipeCommit: `type`, `laneId`, `axis`, `direction`, `delta` (number or {x,y}), `element`, `swipeType`, `laneDirection`, optional `commitStrategy`.
  - swipeRevert: `type`, `laneId`, `element`, `swipeType`, `laneDirection`.
- Optional fields must be ignored safely by consumers; no side effects are encoded in descriptors.

- Descriptors are immutable until they reach renderer.
- Renderer may enrich descriptors with derived, read-only fields (e.g. `absolute`).
- Renderer must not alter semantic fields (type, delta, direction, swipeType).

- All deltas flowing in descriptors are **computed by reactionSwipe**, except raw viewport coordinates attached by intentEngine.
- `absolute` may only be added by renderer as a derived read-only field.
- No other layer may alter `delta` or `rawDelta`.


### Reaction Event Data (emitted via CustomEvent('reaction'))
- swipeStart: `type`, `element`, `laneId`, `axis`, `direction`, `swipeType`, `raw` (viewport coords at start, optional), ownership: resolver builds descriptor, renderer dispatches unchanged.
- swipe: `type`, `element`, `laneId`, `axis`, `swipeType`, `direction`, `delta` (number for axis-locked, `{x,y}` for drag), optional `absolute` (renderer-added for drag), ownership: intentEngine computes deltas, adapter may add `rawDelta` for drag, resolver selects correct delta form, renderer may attach `absolute`.
- swipeCommit: `type`, `element`, `laneId`, `axis`, `direction`, `swipeType`, `laneDirection`, `delta` (number or `{x,y}`), optional `absolute` (renderer-added for drag), ownership: intentEngine provides totals, adapter may add `rawDelta`, resolver passes through, renderer applies policy and may attach `absolute`.
- swipeRevert: `type`, `element`, `laneId`, `swipeType`, `laneDirection`, ownership: resolver emits, renderer may ignore for slider/drag; no absolute added.
- Coordinate space: `x`,`y`,`raw`,`rawDelta`,`absolute` are in viewport client pixels; axis deltas are scalar along detected axis.
- Axis rules: axis-locked swipeTypes use numeric delta along `axis`; drag/drag-and-drop use two-axis `{x,y}` displacement.


## 6. Swipe Type Semantics
- carousel: axis-locked; may commit or revert based on thresholds; renderer animates via carouselState offsets and pendingDir.
- slider: axis-locked; never reverts; commit acts as release and position persists.
- drag / drag-and-drop: free {x,y}; never reverts; commit acts as release and position persists.
- intentEngine is swipeType-agnostic; swipeType gating/behavior is handled by resolver + renderer policy.
- All descriptors emitted by reactionResolver must express movement as delta.
- Absolute positions may be attached by renderer only, as a derived field.
- No upstream layer (engine, adapter, resolver) may emit absolute coordinates.
- Components must prefer `detail.absolute` when present, otherwise fall back to `detail.delta`.
- For drag, renderer may optionally apply smoothing transforms; carouselState is not mutated.
- For carousel/slider, renderer may mutate carouselState offsets; delta fields in descriptors remain immutable.



## 7. State Ownership Rules
- DOM mutation (data-pressed, data-swiping, data-selected) lives only in renderer.
- Swipe offsets and lane state live only in carouselState, mutated only by renderer.
- Pointer lifecycle and raw drag deltas live only in gestureState helpers; other layers may read the attached payloads but do not mutate gestureState directly.
- Pressed/swiping flags are set/cleared only by renderer.
- Components may apply local transforms/styles in response to reaction events or CSS hooks but never compute gesture deltas.
- Lanes must be created via ensureLane before any swipe interaction.
- Renderer may assume lane existence for any descriptor with laneId.
- Lane size must be known before commit decisions; otherwise swipe must not commit.
- Animation timing and easing are owned by CSS and components.
- Renderer only sets numeric state and flags; it never animates.
- No JS-driven animation loops are allowed in gesture handling.


## 8. Forbidden Patterns
- Gesture math or clamping inside Vue components.
- DOM access or mutation in intentEngine, engineAdapter, or reactionResolver.
- Writing non-numeric offsets into carouselState for axis-locked lanes.
- Calling renderer from anywhere except engineAdapter.
- Emitting swipeRevert for slider/drag swipeTypes.
- Using data-* hooks without required lane metadata (direction + swipeType).

## 9. Invariants (Non-Negotiable)
- If any invariant is violated, the system is incorrect by definition.
- intentEngine performs math only and never touches DOM or swipeType policy.
- reactionResolver emits descriptors only; no side effects.
- renderer is the sole mutator of DOM and carouselState.
- carouselState holds numeric offsets for axis-locked lanes; drag offsets are not stored there.
- slider/drag swipeTypes never revert and stay where released.
- carousel swipeType may commit or revert; others must not revert.
- data-* attributes are declarative; missing lane direction/swipeType invalidates lane intent.
- Vue components do not perform gesture logic; they consume reactions and CSS hooks only.
