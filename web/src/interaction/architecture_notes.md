# Architecture Notes

> Observations and recommendations for the gesture engine architecture.
> These are suggestions only — no refactors proposed.

---

## 1. Observations

### 1.1 Pipeline Depth

The current pipeline has 12+ distinct handoff points:

```
inputRouter → intentMapper → intentForwarder → intentManager → intentResolver 
→ intentHelpers → buildPayload → reactionManager → XSolver → XPolicy 
→ dispatcher → stateManager → XState
```

**Observation**: This is intentionally deep for separation, but the naming creates cognitive overhead. Some files have overlapping responsibilities that could confuse contributors.

**Recommendation**: Consider renaming for clarity:
- `intentHelpers.js` → `targetPolicy.js` (it's a policy, not a helper)
- `intentManager.js` → `intentDelegate.js` (file comment already calls it this)
- `intentForwarder.js` → `intentBridge.js` (clearer that it bridges layers)

---

### 1.2 Redundant Delta Handling

Delta is computed and passed through multiple layers:

1. **intentMapper**: Computes `totalDelta` (raw pixels)
2. **intentHelpers**: `resolveDelta()` extracts axis-appropriate value
3. **buildPayload**: Passes delta into descriptor
4. **XSolver**: Clamps delta using policy
5. **XState**: Applies delta

**Observation**: The delta is touched at 5 different points. Each transformation is valid per the contract, but the flow could be more explicit.

**Recommendation**: Document the delta transformation chain in code comments:
```javascript
// Delta lifecycle:
// 1. intentMapper: raw {x,y} pixels
// 2. intentHelpers: axis-extracted scalar (for 1D types)
// 3. buildPayload: unchanged, attached to descriptor
// 4. Solver: clamped to bounds
// 5. State: applied as offset or value change
```

---

### 1.3 buildPayload State Access

`buildPayload.js` reads from state to populate descriptors:

```javascript
laneSize: state.getSize(current.swipeType, current.laneId),
min: state.getMin(current.swipeType, current.laneId),
max: state.getMax(current.swipeType, current.laneId),
value: state.getValue(current.swipeType, current.laneId),
```

**Observation**: This is the only place in the intent layer that reads state. It creates a snapshot for solvers, which is valid per the contract ("Descriptor may include min/max").

**Consideration**: This could alternatively be done in `reactionManager` before calling solvers, keeping the intent layer fully state-agnostic. However, moving it would increase reaction layer complexity.

**Recommendation**: Keep as-is, but add a comment clarifying this is intentional:
```javascript
// NOTE: Reading state here is intentional.
// Creates immutable snapshot for downstream solver math.
// Solvers MUST NOT call state.get*() directly.
```

---

### 1.4 Solver Mutates Descriptor

Solvers modify the descriptor object directly:

```javascript
desc.reaction = desc.type
desc.delta = clampedDelta
return desc
```

**Observation**: This technically violates "immutable descriptor" but is practical. The descriptor is only used once downstream.

**Recommendation**: If strict immutability is desired:
```javascript
return { ...desc, reaction: desc.type, delta: clampedDelta }
```

But this adds allocation overhead for no runtime benefit. Current approach is pragmatic.

---

### 1.5 Unused/Commented Code

Several files contain commented-out code:

- `math/swipeDelta.js` - Entire file is commented out
- `math/swipeMath.js` - Entire file is commented out
- `sliderState.js` - Multiple commented functions at bottom
- `dragState.js` - Locking hooks commented out

**Recommendation**: Either:
1. Delete if truly unused
2. Move to a `deprecated/` folder if kept for reference
3. Add clear `// TODO: Future feature` markers

---

### 1.6 Inconsistent Type Handling

The system supports three swipe types: `carousel`, `slider`, `drag`.

- `carousel` and `slider` flow through the full state management
- `drag` uses a separate `gestureState.js` with different patterns

**Observation**: `dragState.js` exists but is not imported in `stateManager.js` (commented out). `SwipeDrag.vue` uses `dragState.js` functions directly (`setDragPosition`, `getDragPosition`).

**Recommendation**: Either:
1. Integrate drag fully into stateManager for consistency
2. Or document that drag intentionally bypasses stateManager

---

### 1.7 Two Files Named "State"

- `gestureState.js` - Low-level gesture tracking (start position, drag bases)
- `dragState.js` - Drag-specific state

**Observation**: `gestureState.js` appears to overlap with intentMapper's internal state for gesture lifecycle tracking.

**Recommendation**: Clarify the distinction:
- `gestureState.js` = persistent positions across gestures
- `intentMapper` state = single gesture lifecycle
- Consider renaming `gestureState.js` → `dragPositionStore.js`

---

### 1.8 DOM Event Path

Events flow:
1. Dispatcher sets `data-*` attributes on DOM
2. Dispatcher dispatches `reaction` CustomEvent
3. Vue components listen for `reaction` event
4. Components emit Vue events to parents

**Observation**: This two-hop event system (CustomEvent → Vue emit) could be simplified if Vue components listened directly to state changes.

**Trade-off**: Current approach decouples Vue from the reaction layer completely. Components only see events, not internal mechanics. This is good for the contract.

**Recommendation**: Keep current approach. The indirection is intentional separation.

---

### 1.9 sizeState.js Purpose

`sizeState.js` handles device scaling for web preview mode.

**Observation**: This is orthogonal to gesture logic. It's used for responsive scaling when previewing phone UI in browser.

**Recommendation**: Move to a separate `config/` or `layout/` folder to clarify it's not part of the gesture pipeline.

---

## 2. Data Flow Redundancy

### 2.1 Axis Determined Twice

Axis is determined in:
1. `intentMapper`: Estimates axis from delta magnitude
2. `intentHelpers.resolveAxis()`: Validates against target's supported axes

**Observation**: Both are valid. First is "what the user is doing", second is "what the target accepts".

**Recommendation**: No change needed. Add explanatory comment:
```javascript
// intentMapper estimate: user's dominant gesture direction
// resolveAxis: negotiated axis based on target capability
```

---

### 2.2 Target Resolved Multiple Times

Target resolution happens in:
1. `intentHelpers.resolveTarget()` - on press
2. `intentHelpers.resolveSwipeTarget()` - on swipeStart

**Observation**: This is correct — target can change from press to swipe (e.g., press a button, swipe steals to carousel).

**Recommendation**: No change. The double resolution is intentional for gesture ownership transfer.

---

## 3. Long-Term Maintainability

### 3.1 File Count

The interaction folder has 18+ JavaScript files. For a gesture engine, this is high but intentional for separation.

**Risk**: New contributors may struggle to understand data flow.

**Mitigation**: The `gesture_contract.md` addresses this. Consider also:
- A visual diagram in the README
- JSDoc @module tags linking related files

### 3.2 Testing Strategy

Current architecture is highly testable:
- Policies: Pure functions, trivially unit testable
- Solvers: Receive descriptor, return augmented descriptor
- State: Predictable mutations

**Recommendation**: If not already present, add:
- Unit tests for all policy functions
- Integration tests for solver → state flow
- E2E tests for complete gesture sequences

### 3.3 Error Boundaries

Current error handling is minimal:
```javascript
if (!descriptor || !descriptor.element) return
```

**Recommendation**: Consider adding:
- Centralized error logging in dispatcher
- Validation at layer boundaries (dev mode only)
- Clear error messages indicating which contract was violated

---

## 4. Summary

| Area | Status | Priority |
|------|--------|----------|
| Naming clarity | Could improve | Low |
| Commented code cleanup | Should do | Medium |
| Drag type consistency | Needs attention | Medium |
| State immutability | Pragmatic compromise | None |
| Documentation | Now formalized | ✓ |
| Test coverage | Unknown | Medium |

The architecture is sound. The intentional over-structuring achieves its goal of preventing coupling. Most observations are minor clarifications rather than design issues.
