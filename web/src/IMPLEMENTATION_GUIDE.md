## Implementation Checklist - Kotlin Bridge

### ✅ JavaScript Side (Done)

- [x] `gestureEngine.js` - Interface
- [x] `inputState.js` - Shared state
- [x] `jsEngine.js` - Browser engine
- [x] `inputRouter.js` - Engine selector
- [x] `androidGestureAdapter.js` - **NEW** Kotlin bridge ← CREATE THIS
- [x] Removed deprecated files (pressGesture, swipeGesture, unifiedInputDriver)
- [x] Documentation updated for position-based approach

### ⏳ Kotlin Side (You implement)

- [ ] Add `JavascriptInterface` callback to WebView
- [ ] Call `window.GestureCallback?.onSwipeDown(x, y)` on touch down
- [ ] Call `window.GestureCallback?.onSwipeMove(x, y)` on movement
- [ ] Call `window.GestureCallback?.onSwipeMove(x, y)` in momentum loop
- [ ] Call `window.GestureCallback?.onSwipeEnd()` when momentum ends

---

## Integration Guide (Quick Start)

### 1. Update Your Bootstrap

```javascript
// src/bootstrap/initInputSystem.js
import { initInputRouter } from '../input/core/inputRouter'
import { initSwipeLaneController } from '../input/core/swipeLaneController'
import { androidGestureAdapter } from '../input/core/androidGestureAdapter'

export function initInputSystem() {
  // Attach Kotlin bridge
  window.GestureCallback = androidGestureAdapter

  // Initialize routing (JS engine for carousel FSM)
  initInputRouter('js', document.body)

  // Connect carousel state
  initSwipeLaneController()
}
```

### 2. Update Your Kotlin SwipeEngine

```kotlin
// Add these calls in your existing SwipeEngine

object SwipeEngine {
    fun onDown(x: Float, y: Float) {
        // ... existing velocity init ...
        
        // NEW: Notify JS
        webView?.post {
            webView?.evaluateJavascript(
                "window.GestureCallback?.onSwipeDown($x, $y)",
                null
            )
        }
    }

    fun onMove(x: Float, y: Float) {
        // ... existing velocity calc ...
        
        // NEW: Notify JS
        webView?.post {
            webView?.evaluateJavascript(
                "window.GestureCallback?.onSwipeMove($x, $y)",
                null
            )
        }
    }

    fun onUp(onUpdate: (Float, Float) -> Unit) {
        // ... existing init ...
        
        Thread {
            while (/* momentum condition */) {
                posX += vX * FRAME_MS
                posY += vY * FRAME_MS
                onUpdate(posX, posY)
                
                // NEW: Notify JS of momentum update
                webView?.post {
                    webView?.evaluateJavascript(
                        "window.GestureCallback?.onSwipeMove($posX, $posY)",
                        null
                    )
                }
                
                vX *= DECAY
                vY *= DECAY
                Thread.sleep(FRAME_MS)
            }
            
            // NEW: Notify JS when done
            webView?.post {
                webView?.evaluateJavascript(
                    "window.GestureCallback?.onSwipeEnd()",
                    null
                )
            }
        }.start()
    }
}
```

### 3. Test in Browser

```javascript
// In browser console, simulate Kotlin swipe
window.GestureCallback.onSwipeDown(100, 100)
window.GestureCallback.onSwipeMove(125, 100)  // +25px movement
window.GestureCallback.onSwipeMove(150, 100)  // +25px more
window.GestureCallback.onSwipeMove(170, 100)  // +20px more (momentum decay)
window.GestureCallback.onSwipeEnd()

// Check carousel state
console.log(swipeState.lanes)  // Should show new index/offset
```

---

## Data Flow Verification

### 1. Check Kotlin → JS Bridge

```kotlin
// In Kotlin, add logging
fun sendToJS(method: String, x: Float, y: Float) {
    Log.d("SwipeEngine", "Sending $method($x, $y) to JS")
    webView?.post {
        webView?.evaluateJavascript(
            "window.GestureCallback?.$method($x, $y); console.log('$method', $x, $y)",
            null
        )
    }
}
```

### 2. Check JS Bridge → Event Bus

```javascript
// In androidGestureAdapter.js, already has logging:
log('KotlinHandler', 'SWIPE_MOVE', { delta, total: totalDelta })

// Enable debug logging
import { getErrors } from '../debug/inputDebug'
// Should show SWIPE_MOVE events
```

### 3. Check Event Bus → Carousel

```javascript
// In browser console
gestureBus.on(GestureType.SWIPE_MOVE, (data) => {
  console.log('[Verify] Got SWIPE_MOVE:', data)
})

// Then trigger Kotlin gesture
window.GestureCallback.onSwipeMove(150, 100)
```

### 4. Check Carousel → UI

```javascript
// In browser console
console.log('Lane state:', swipeState.lanes)
// Check offset and index change as you swipe
```

---

## Common Issues & Solutions

### Issue: Kotlin calls JS but nothing happens

**Symptoms:** No console log, carousel doesn't move

**Check:**
1. Is `window.GestureCallback` defined? 
   ```javascript
   console.log(window.GestureCallback) // Should show object
   ```

2. Is Kotlin calling it?
   ```kotlin
   Log.d("SwipeEngine", "Sending to JS...")  // Add logging
   ```

3. Try simpler test:
   ```javascript
   window.GestureCallback.onSwipeDown(100, 100)
   console.log(window.GestureCallback.getState())
   ```

### Issue: Events fire but carousel doesn't move

**Symptoms:** SWIPE_MOVE events logged, but carousel frozen

**Check:**
1. Is `swipeLaneController` initialized?
   ```javascript
   console.log(swipeState.lanes)  // Should have data
   ```

2. Is carousel listening?
   ```javascript
   // In SwipeCarousel.vue:
   console.log('Lane data:', swipeState.lanes['carousel-id'])
   ```

3. Try manual state update:
   ```javascript
   swipeState.lanes['carousel-1'].offset = -200
   // Carousel should animate
   ```

### Issue: Axis detection wrong (vertical swipe treated as horizontal)

**Symptoms:** Swiping up/down moves carousel left/right

**Check:**
1. Are your touch coordinates correct?
   ```kotlin
   Log.d("SwipeEngine", "X: $x, Y: $y")  // Verify these
   ```

2. Match coordinate system between Kotlin and JS
   ```javascript
   // In browser, check first movement
   console.log('distX:', distFromStartX, 'distY:', distFromStartY)
   // X should be larger than Y for horizontal swipe
   ```

### Issue: Momentum looks choppy

**Symptoms:** Carousel animation stutters

**Check:**
1. Kotlin thread timing:
   ```kotlin
   const val FRAME_MS = 16L  // Should be ~60fps
   ```

2. JS is receiving updates:
   ```javascript
   let count = 0
   gestureBus.on(GestureType.SWIPE_MOVE, () => count++)
   // After momentum, count should be ~30-50 (2-3 seconds at 60fps)
   ```

---

## Performance Tips

1. **Throttle Kotlin updates?**
   - Current: Every 16ms (~60fps)
   - If too many, reduce in Kotlin
   - Don't reduce below ~30fps

2. **Debounce JS reactions?**
   - swipeLaneController already debounces
   - No changes needed on JS side

3. **Thread safety:**
   - Always use `webView.post { }` in Kotlin
   - Never call `evaluateJavascript` from background thread!

---

## Files Ready

| File | Status | Notes |
|------|--------|-------|
| `input/core/androidGestureAdapter.js` | ✨ NEW | Copy into your project |
| `input/core/inputRouter.js` | 📝 UPDATED | Already done |
| `bootstrap/initInputSystem.js` | 📝 NEEDS UPDATE | Add androidGestureAdapter |
| Kotlin SwipeEngine | ⏳ NEEDS UPDATE | Add JS bridge calls |

---

## Testing Script (Browser)

Copy & paste to test everything:

```javascript
// 1. Check bridge exists
console.assert(window.GestureCallback, 'GestureCallback not found!')
console.log('✅ GestureCallback:', window.GestureCallback)

// 2. Check state before
const stateBefore = swipeState.lanes['carousel-1']
console.log('State before:', stateBefore)

// 3. Simulate swipe
window.GestureCallback.onSwipeDown(100, 100)
window.GestureCallback.onSwipeMove(150, 100)  // +50px horizontal
window.GestureCallback.onSwipeMove(200, 100)  // +50px more
window.GestureCallback.onSwipeEnd()

// 4. Check state after
const stateAfter = swipeState.lanes['carousel-1']
console.log('State after:', stateAfter)
console.assert(stateAfter.offset !== stateBefore.offset, 'Carousel didn\'t move!')
console.log('✅ Carousel moved:', stateAfter.offset - stateBefore.offset, 'px')
```

---

## Success Criteria

✅ Swipe left moves carousel  
✅ Swipe right moves carousel  
✅ Momentum animation visible  
✅ No console errors  
✅ Event flow: Kotlin → JS bridge → gestureBus → carousel  
✅ Carousel snaps to next/prev item when released  

You're ready to go! 🚀
