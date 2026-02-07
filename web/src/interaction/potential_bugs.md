# Potential Bugs

> Bugs identified from code review. Only obvious issues from reading the flow.

---

## 1. Typo in inputRouter.js

**File:** `inputRouter.js` line 73  
**Severity:** Critical (breaks browser input)

```javascript
function onPointerUp(e) {
  intentMap.onUp(e.clientX, e.cluentY)  // ❌ TYPO: "cluentY"
}
```

**Expected:**
```javascript
function onPointerUp(e) {
  intentMap.onUp(e.clientX, e.clientY)  // ✓ FIXED: "clientY"
}
```

**Impact:** In browser mode, all pointer-up events pass garbage Y coordinate. This likely causes incorrect gesture termination behavior, especially for vertical swipes.

---

## 2. SwipeDrag.vue Contains Gesture Math

**File:** `SwipeDrag.vue` lines 55-60  
**Severity:** Medium (contract violation)

```javascript
case 'swipe':
  const delta = detail.delta || { x: 0, y: 0 }
  const absolute = {
    x: startPos.x + (delta.x || 0),  // ❌ position calculation
    y: startPos.y + (delta.y || 0)
  }
  position.value = absolute
```

**Issue:** The component performs position arithmetic, which should be handled in the solver or state layer per the contract.

**Impact:** If drag clamping or boundary logic is added later, it would need to be duplicated in the component OR the architecture violated further.

**Recommendation:** Move absolute position calculation to `dragSolver` or `dragState`. The descriptor should carry the computed absolute position, not require the component to derive it.

---

## 3. dragState Not Integrated in stateManager

**File:** `stateManager.js` line 3  
**Severity:** Medium (inconsistency)

```javascript
import { carouselStateFn } from './carouselState'
import { sliderStateFn } from './sliderState'
// import { dragStateFn } from './dragState'  // ❌ commented out

const stateFiles = {
    carousel: carouselStateFn,
    slider: sliderStateFn,
    // drag: dragStateFn  // ❌ not integrated
}
```

**Impact:** Drag gestures bypass the normal state management flow. `SwipeDrag.vue` directly imports from `dragState.js`, creating an inconsistent pattern.

**Recommendation:** Either:
1. Integrate drag into stateManager
2. Or document this as intentional architectural difference

---

## 4. Missing Null Guard in intentForwarder

**File:** `intentForwarder.js` lines 7-10  
**Severity:** Low (defensive coding)

```javascript
export function intentForward(intent) {
  const packet = delegate(intent)
  forwardPacket(packet)  // packet could be null if delegate returns null
  return {
    acceptedGesture: packet?.control?.acceptedGesture === true,
  }
}
```

**Issue:** `forwardPacket` is called even when `packet` is null. While `forwardPacket` handles this (`if (!packet) return`), the flow is not immediately clear.

**Recommendation:** Explicit early return:
```javascript
export function intentForward(intent) {
  const packet = delegate(intent)
  if (!packet) return { acceptedGesture: false }
  forwardPacket(packet)
  return {
    acceptedGesture: packet?.control?.acceptedGesture === true,
  }
}
```

---

## 5. swipeThresholdCalc Always Returns True

**File:** `clampMath.js` lines 11-13  
**Severity:** Low (appears intentional, but unusual)

```javascript
export function swipeThresholdCalc(value) {
    return true  // always true regardless of value
}
```

**Issue:** This function ignores its input and always returns true. This means ANY movement triggers swipe detection.

**Impact:** May cause unintended swipe activation on small accidental movements.

**Recommendation:** If intentional, add comment. If not, implement threshold:
```javascript
export function swipeThresholdCalc(value) {
    return value > APP_SETTINGS.swipeThreshold  // e.g., 10px
}
```

---

## 6. carouselState Imports from Policy

**File:** `carouselState.js` line 3  
**Severity:** Low (minor contract blur)

```javascript
import { getNextIndex } from '../reaction/policy/carouselPolicy'
```

**Issue:** State layer imports from policy layer. While `getNextIndex` is a pure function, this creates a dependency from state → policy.

**Impact:** Minor. The function is pure and appropriate to reuse. However, it blurs the "state should not know policy" boundary.

**Recommendation:** Either:
1. Move `getNextIndex` to a shared math utility
2. Or accept this as a pragmatic exception (document it)

---

## 7. Missing Drag Solver Invocation

**File:** `dragSolver.js`  
**Severity:** Low-Medium (functionality gap)

The `dragSolver` expects `deltaX` and `deltaY` in the descriptor:
```javascript
swipe(desc) {
  const { deltaX, deltaY, bounds } = desc  // expects deltaX, deltaY
```

But `buildPayload.js` passes `delta` as:
```javascript
delta: result?.delta ?? null  // could be {x, y} or number
```

**Issue:** For drag type, `intentHelpers.resolveDelta` returns the full `{x, y}` object as `delta`, not `deltaX`/`deltaY`.

```javascript
if (swipeType === 'drag') {
  return delta // keep {x,y}
}
```

**Impact:** `dragSolver` receives `delta: {x, y}` but expects `deltaX, deltaY`. The solver will get `undefined` for both.

**Recommendation:** Either:
1. Rename in buildPayload: `deltaX: delta.x, deltaY: delta.y`
2. Or update dragSolver to read `delta.x, delta.y`

---

## Summary

| Bug | Severity | Type |
|-----|----------|------|
| Typo `cluentY` | Critical | Runtime error |
| SwipeDrag math | Medium | Contract violation |
| dragState not integrated | Medium | Inconsistency |
| Missing null guard | Low | Defensive coding |
| Threshold always true | Low | Likely intentional |
| carouselState imports policy | Low | Minor contract blur |
| Drag delta naming mismatch | Low-Medium | Functionality gap |

**Priority fix:** The `cluentY` typo should be fixed immediately as it breaks browser pointer handling.
