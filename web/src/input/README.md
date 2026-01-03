## Input System Architecture

Clear breakdown of what each file does and which platforms use it.

---

## 🎯 Quick Reference

| File | Purpose | Used By | Scope |
|------|---------|---------|-------|
| **gestureBus.js** | Event publisher/subscriber | Both | Shared |
| **gestureTypes.js** | Event type constants | Both | Shared |
| **gestureTargetRegistry.js** | Element → gesture handler mapping | Both | Shared |
| **gestureState.js** | FSM state structure | Both | Shared |
| **gestureEngineRouter.js** | Selects active gesture engine | Both | Shared |
| **gestureEngine.js** | Abstract interface (reference) | Both | Shared |
| **jsEngine.js** | Processes PointerEvents (browser) | **JS Only** | Browser |
| **androidGestureAdapter.js** | Converts Android positions → events | **Android Only** | Kotlin Bridge |
| **carouselGestureController.js** | Listens to events, updates carousel | Both | UI |
| **gestureDebug.js** | Logging & debugging utilities | Both | Utility |

---

## 📁 File Organization

### Bus & Events (Shared by all engines)
```
bus/
├── gestureBus.js
│   • Pub/sub event stream
│   • All engines emit here
│   • All UI listeners subscribe here
│
└── gestureTypes.js
    • Event type constants (SWIPE_START, SWIPE_MOVE, etc.)
    • Shared contract between engines
```

### Core Gesture Logic (Shared)
```
core/
├── gestureTargetRegistry.js
│   • Maps DOM elements → gesture handlers
│   • Used by jsEngine to find which elements handle swipes
│   • Used by Android adapter for element tracking
│
├── gestureState.js
│   • Creates FSM state structure
│   • resetGestureState() function
│   • Same structure for both JS and Android
│
├── gestureEngine.js
│   • Abstract interface (reference documentation)
│   • Both jsEngine and Android adapter implement this pattern
│
├── gestureEngineRouter.js
│   • initGestureEngineRouter(type) - initializes active engine
│   • getActiveEngine() - inspect which engine is active
│   • switchEngine() - runtime engine switching
│
├── jsEngine.js
│   • ✅ JS Only - Browser PointerEvent → gesture events
│   • Listens to: pointerdown, pointermove, pointerup
│   • Emits to: gestureBus
│   • State: FSM (IDLE → PRESS_PENDING → SWIPING)
│
├── androidGestureAdapter.js
│   • ✅ Android Only - Kotlin positions → gesture events
│   • Listens to: window.GestureCallback (from Kotlin)
│   • Emits to: gestureBus
│   • State: Same FSM as JS engine
│
└── carouselGestureController.js
    • Listens to: gestureBus events
    • Updates: swipeState (carousel position/index)
    • Platform agnostic (works with any engine)
```

### Debug (Utility)
```
debug/
└── gestureDebug.js
    • log() - debug logging
    • drawDot() - visual debugging on canvas
    • debugLagTime() - performance tracking
```

---

## 🔄 Data Flow

### Browser (JS Engine)
```
PointerEvent (DOM)
  ↓
jsEngine.handle(type, event)
  ├─ Maintains FSM state
  ├─ Detects gestures
  └─ Emits events
  ↓
gestureBus.emit(SWIPE_MOVE, {delta, total, axis})
  ↓
carouselGestureController listens
  ├─ Updates swipeState.lanes[id].offset
  └─ Triggers carousel animation
```

### Android (Android Gesture Adapter)
```
Kotlin SwipeEngine
  ↓
window.GestureCallback.onSwipeMove(x, y)
  ↓
androidGestureAdapter.onSwipeMove(x, y)
  ├─ Calculates: delta = (x - lastX)
  ├─ Maintains FSM state
  └─ Emits events
  ↓
gestureBus.emit(SWIPE_MOVE, {delta, total, axis})
  ↓
carouselGestureController listens
  ├─ Updates swipeState.lanes[id].offset
  └─ Triggers carousel animation
```

---

## 📊 State Management

### Gesture State (Input Layer)
```javascript
// Created by gestureState.js
{
  fsmState: 'IDLE' | 'PRESS_PENDING' | 'SWIPING',
  pressCandidate: Element | null,
  swipeCandidate: Element | null,
  swipeAxis: 'horizontal' | 'vertical' | null,
  swipeAccum: number,           // Accumulated pixels
  swipeStarted: boolean,
  start: {x, y},                // Initial touch
  last: {x, y}                  // Last recorded position
}
```

Used by:
- **jsEngine.js** - Directly manages this state
- **androidGestureAdapter.js** - Also maintains identical state
- **gestureState.js** - Provides factory & reset function

### Carousel State (UI Layer)
```javascript
// In src/state/swipeState.js (NOT in input/)
{
  lanes: {
    'carousel-1': {
      index: 2,                 // Current item
      offset: -200,             // Animation pixel offset
      dragging: true,
      size: 400                 // Carousel width
    }
  }
}
```

Used by:
- **carouselGestureController.js** - Updates when events fire
- **SwipeCarousel.vue** - Watches for reactive updates

---

## 🎯 Scope Legend

### Shared (Both JS & Android)
- Event bus
- Event types
- Element registry
- FSM state structure
- Engine router
- Carousel controller
- Debug utilities

### JS Only (Browser)
- **jsEngine.js** - Processes PointerEvents
- Directly adds event listeners
- Accesses DOM via document.elementsFromPoint()

### Android Only (Kotlin Bridge)
- **androidGestureAdapter.js** - Receives position updates from Kotlin
- Accessed via window.GestureCallback
- No DOM access (element IDs instead of references)

---

## 🔗 Dependencies

### jsEngine imports:
```javascript
import { createGestureState, resetGestureState } from './gestureState'
import { gestureTargetRegistry } from './gestureTargetRegistry'
import { gestureBus } from '../bus/gestureBus'
import { GestureType } from '../bus/gestureTypes'
import { log } from '../debug/gestureDebug'
```

### androidGestureAdapter imports:
```javascript
import { gestureBus } from '../bus/gestureBus'
import { GestureType } from '../bus/gestureTypes'
import { log } from '../debug/gestureDebug'
```

### carouselGestureController imports:
```javascript
import { gestureBus } from '../bus/gestureBus'
import { GestureType } from '../bus/gestureTypes'
import { ensureLane, applyLaneOffset, commitLaneSwipe } from '../../state/swipeState'
import { APP_SETTINGS } from '../../config/appSettings'
```

### gestureEngineRouter imports:
```javascript
import { jsEngine } from '../engines/jsEngine'
```

---

## 🚀 Initialization Order

```javascript
// 1. bootstrap/initInputSystem.js
import { initGestureEngineRouter } from '../input/core/gestureEngineRouter'
import { initCarouselGestureController } from '../input/core/carouselGestureController'
import { androidGestureAdapter } from '../input/core/androidGestureAdapter'

window.GestureCallback = androidGestureAdapter  // For Kotlin bridge
initGestureEngineRouter('js')                   // Activate JS engine
initCarouselGestureController()                 // Connect carousel listener
```

---

## 🧪 Testing Approach

### Unit Test: Single Engine
```javascript
import { jsEngine } from '@/input/engines/jsEngine'
jsEngine.init(container)
jsEngine.handle('down', pointerEvent)
// Assert: state changed, events emitted
```

### Integration Test: Full Pipeline
```javascript
// Browser path
window.dispatchEvent(new PointerEvent('pointerdown'))
// Assert: carousel moved

// Android path (simulated)
window.GestureCallback.onSwipeMove(150, 100)
// Assert: carousel moved
```

---

## 📋 Summary

| Category | Files | Purpose |
|----------|-------|---------|
| **Events** | 2 | Pub/sub system and event types |
| **Core** | 5 | State, registry, engine routing |
| **Engines** | 2 | JS and Android implementations |
| **UI** | 1 | Carousel state sync |
| **Debug** | 1 | Logging utilities |
| **Total** | 11 | Complete gesture system |

**Platform Support:**
- 🌐 Browser: JS engine (pointerdown/move/up)
- 📱 Android: Android adapter (Kotlin positions)
- 🎨 UI: Both (shared gesture bus)

---

## ✨ Design Principles

1. **Clear Naming**
   - `gesture*` prefix = gesture-specific
   - `js*` / `android*` = platform-specific
   - No ambiguous "input" names

2. **Single Responsibility**
   - Each file has one clear job
   - Minimal dependencies
   - Easy to test in isolation

3. **Shared Contract**
   - Both engines maintain same FSM state
   - Both emit same events
   - UI layer agnostic of source

4. **Scalable**
   - Add new engine? Just extend gestureEngine interface
   - Add new event type? Add to gestureTypes.js
   - Platform-independent carousel logic
