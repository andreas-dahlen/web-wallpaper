## 📋 Quick Integration Checklist

### Your Kotlin SwipeEngine → JavaScript

Copy this exact pattern into your existing `SwipeEngine`:

#### ✅ Step 1: onDown - Notify JS of gesture start
```kotlin
fun onDown(x: Float, y: Float) {
    lastX = x
    lastY = y
    // ... existing code ...
    
    // ADD THIS:
    webView?.post {
        webView?.evaluateJavascript(
            "window.GestureCallback?.onSwipeDown($x, $y)",
            null
        )
    }
}
```

#### ✅ Step 2: onMove - Send every position update
```kotlin
fun onMove(x: Float, y: Float) {
    // ... velocity calculation ...
    
    // ADD THIS:
    webView?.post {
        webView?.evaluateJavascript(
            "window.GestureCallback?.onSwipeMove($x, $y)",
            null
        )
    }
}
```

#### ✅ Step 3: onUp - Send momentum updates AND final end
```kotlin
fun onUp(onUpdate: (Float, Float) -> Unit) {
    if (!active) return
    active = false

    var posX = lastX
    var posY = lastY
    var vX = velocityX
    var vY = velocityY

    Thread {
        while (abs(vX) > MIN_VELOCITY || abs(vY) > MIN_VELOCITY) {
            posX += vX * FRAME_MS
            posY += vY * FRAME_MS
            onUpdate(posX, posY)
            
            // ADD THIS (momentum position updates):
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
        
        // ADD THIS (momentum complete):
        webView?.post {
            webView?.evaluateJavascript(
                "window.GestureCallback?.onSwipeEnd()",
                null
            )
        }
    }.start()
}
```

---

### Your JavaScript Bootstrap

Update `src/bootstrap/initInputSystem.js`:

```javascript
import { initInputRouter } from '../input/core/inputRouter'
import { initSwipeLaneController } from '../input/core/swipeLaneController'
import { kotlinPositionHandler } from '../input/core/kotlinPositionHandler'  // NEW

export function initInputSystem() {
  // NEW: Attach the Kotlin bridge
  window.GestureCallback = kotlinPositionHandler

  // Existing: Initialize input routing
  initInputRouter('js', document.body)

  // Existing: Initialize carousel controller
  initSwipeLaneController()
}
```

---

### ✅ Test It

Copy-paste into browser console:

```javascript
// Test the bridge
window.GestureCallback.onSwipeDown(100, 100)
window.GestureCallback.onSwipeMove(125, 100)  // +25px
window.GestureCallback.onSwipeMove(150, 100)  // +25px
window.GestureCallback.onSwipeMove(175, 100)  // +25px
window.GestureCallback.onSwipeEnd()

// Check carousel state changed
console.log('Lane state:', swipeState.lanes)
```

If carousel moved → 🎉 Integration successful!

---

## 📞 File Locations

- **JS Handler:** `src/input/core/kotlinPositionHandler.js` ← Ready to use!
- **Kotlin Bridge:** Your `SwipeEngine.onDown/onMove/onUp` ← Add calls
- **Bootstrap:** `src/bootstrap/initInputSystem.js` ← Update one line

---

## 🔍 What Happens Behind the Scenes

```
Kotlin: onSwipeMove(150, 100)
  ↓
JS: window.GestureCallback.onSwipeMove(150, 100)
  ↓
kotlinPositionHandler.onSwipeMove()
  - Calculates: delta = (150 - lastX)
  - Emits: gestureBus.emit(SWIPE_MOVE, {delta, total})
  ↓
swipeLaneController listens
  - Updates swipeState.lanes[id].offset
  ↓
SwipeCarousel.vue watches swipeState
  - Re-renders with new offset
```

No magic, just position → delta → event → state → UI

---

## ✨ Files You Get

| File | What It Does |
|------|------------|
| `kotlinPositionHandler.js` | Converts Kotlin positions to gesture events |
| `swipeLaneController.js` | Listens to events, updates carousel state |
| `swipeState.js` | Vue reactive state for carousel |

All three work together. You just feed positions from Kotlin!

---

## 🚨 Common Mistakes

❌ **Forgetting to call from Kotlin**
- Nothing happens if your `SwipeEngine` doesn't call JS
- ✅ Do: Add `webView?.post { evaluateJavascript(...) }`

❌ **Calling from wrong thread**
- Will crash silently or hang
- ✅ Do: Always use `webView?.post { }` wrapper

❌ **Wrong coordinate system**
- Swipes move in wrong direction
- ✅ Do: Verify X/Y match between Kotlin and JS

❌ **Not attaching the bridge**
- `window.GestureCallback` is undefined
- ✅ Do: `window.GestureCallback = kotlinPositionHandler` in bootstrap

---

## ✅ Success Checklist

- [ ] Added `webView?.post { evaluateJavascript(...) }` in Kotlin onDown
- [ ] Added `webView?.post { evaluateJavascript(...) }` in Kotlin onMove
- [ ] Added `webView?.post { evaluateJavascript(...) }` in Kotlin momentum loop
- [ ] Added `webView?.post { evaluateJavascript(...) }` at end of momentum
- [ ] Updated `initInputSystem.js` to attach `kotlinPositionHandler`
- [ ] Browser test: Swipe moves carousel
- [ ] Kotlin test: Native swipe moves carousel

---

## 📞 Debugging

**Q: Nothing moves when I swipe on Android**

A: Check:
```kotlin
Log.d("SwipeEngine", "onMove called: $x, $y")  // Add logging
webView?.post {
    Log.d("SwipeEngine", "Sending to JS...")
    webView?.evaluateJavascript(
        "window.GestureCallback?.onSwipeMove($x, $y)",
        null
    )
}
```

**Q: Carousel moves but direction wrong**

A: Check coordinate system:
```kotlin
Log.d("SwipeEngine", "X: $x, Y: $y")  // Verify values increasing correctly
```

**Q: Smooth motion in browser but choppy on Android**

A: Your FRAME_MS might be too long:
```kotlin
const val FRAME_MS = 16L  // Should be ~60fps (16-17ms)
```

**Q: Random crashes**

A: Check you're not calling JS from background thread:
```kotlin
// ✅ GOOD
webView?.post {
    webView?.evaluateJavascript(...)
}

// ❌ BAD
webView?.evaluateJavascript(...)  // From Thread!
```

---

## 🎁 You Get Everything

- ✅ Position handler (ready to use)
- ✅ Event system (unchanged, tested)
- ✅ Carousel state (reactive)
- ✅ Documentation (comprehensive)
- ✅ Examples (detailed)
- ✅ Debugging guide (thorough)

Just connect the dots!

---

## 🚀 Ready?

1. Open `src/input/core/kotlinPositionHandler.js` - It's there!
2. Add 4 calls to your Kotlin `SwipeEngine`
3. Update `src/bootstrap/initInputSystem.js` with one line
4. Test in browser
5. Test on Android

That's it! 🎉
