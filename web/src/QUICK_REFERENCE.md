## Quick Reference - Dual Engine System

### File Quick Lookup

| File | Purpose | Status |
|------|---------|--------|
| `core/gestureEngine.js` | Abstract interface | ✨ NEW |
| `core/inputState.js` | Shared state factory | ✨ NEW |
| `core/inputRouter.js` | Engine selector | 📝 UPDATED |
| `engines/jsEngine.js` | Browser engine | ✨ NEW |
| `engines/kotlinEngine.js` | Native bridge | ✨ NEW |
| `bus/gestureBus.js` | Event bus | ✅ UNCHANGED |
| `bus/gestureTypes.js` | Event types | ✅ UNCHANGED |

---

### API Reference

#### Initialize
```javascript
import { initInputRouter } from '@/input/core/inputRouter'

initInputRouter('js', container)      // Browser
initInputRouter('kotlin', window)     // Native
```

#### Get Active Engine
```javascript
import { getActiveEngine } from '@/input/core/inputRouter'

const engine = getActiveEngine()
```

#### Get FSM State
```javascript
import { getEngineState } from '@/input/core/inputRouter'

const state = getEngineState()  // 'IDLE' | 'PRESS_PENDING' | 'SWIPING'
```

#### Switch Engines
```javascript
import { switchEngine } from '@/input/core/inputRouter'

switchEngine('kotlin')  // Switch to Kotlin
switchEngine('js')      // Switch to JS
```

#### Listen for Events
```javascript
import { gestureBus } from '@/input/bus/gestureBus'
import { GestureType } from '@/input/bus/gestureTypes'

gestureBus.on(GestureType.SWIPE_START, (data) => {
  console.log('Swipe started on:', data.el || data.elementId)
})
```

---

### Event Types

```javascript
{
  PRESS_START:  'pressStart',    // Finger down
  PRESS_END:    'pressEnd',      // Finger up
  SWIPE_START:  'swipeStart',    // Move threshold crossed
  SWIPE_MOVE:   'swipeMove',     // Active swipe
  SWIPE_END:    'swipeEnd'       // Swipe released
}
```

---

### State Structure

```javascript
{
  fsmState: string,           // 'IDLE' | 'PRESS_PENDING' | 'SWIPING'
  pressCandidate: Element,    // Current press element
  swipeCandidate: Element,    // Current swipe element
  swipeAxis: string,          // 'horizontal' | 'vertical'
  swipeAccum: number,         // Total movement pixels
  swipeStarted: boolean,      // Has swipe begun?
  start: {x, y},              // Initial position
  last: {x, y}                // Last recorded position
}
```

---

### Engine Events

#### JS Engine → Browser
```
Browser PointerEvent
  → jsEngine.handle(type, event)
    → gestureBus.emit(GestureType.*)
```

#### Kotlin Engine ← Native
```
Native Touch Event
  → Kotlin processes
    → window.NativeBridge.handleGestureEvent(type, payload)
      → kotlinEngine.handleNativeEvent(type, payload)
        → gestureBus.emit(GestureType.*)
```

---

### FSM Diagram (Both Engines)

```
     ┌─ DOWN ────┐
     ↓           │
  [IDLE] ←───────┘
     ↑
     └─ UP ──────┐
                 │
          ┌──────┴──────┐
          ↓             ↓
    [PRESS]      [SWIPE] ─→ UP ──┐
    [PENDING]                    │
          ↑                       │
          └───────────────────────┘
```

---

### Decision Tree

```
Initialize Input System
    ↓
Is native platform?
    ├─ YES → initInputRouter('kotlin')
    │           ↓
    │        Kotlin sends events via NativeBridge
    │
    └─ NO  → initInputRouter('js')
                ↓
             Browser sends PointerEvents
```

---

### Payload Examples

#### JS Engine - Browser PointerEvent
```javascript
{
  clientX: 100,
  clientY: 200,
  type: 'pointerdown',
  // ...standard DOM event properties
}
```

#### Kotlin Engine - Native Event
```javascript
// DOWN
{ x: 100, y: 200, elementId: 'carousel' }

// MOVE
{ x: 150, y: 200, delta: 50, total: 50, axis: 'horizontal' }

// UP
{ x: 150, y: 200, total: 50, axis: 'horizontal' }
```

---

### Testing Snippets

```javascript
// Simulate JS engine
import { jsEngine } from '@/input/engines/jsEngine'
jsEngine.handle('down', new PointerEvent('pointerdown', {
  clientX: 100, clientY: 200
}))

// Simulate Kotlin engine
import { kotlinEngine } from '@/input/engines/kotlinEngine'
kotlinEngine.handleNativeEvent('DOWN', {
  x: 100, y: 200, elementId: 'test'
})

// Both should emit identical events!
```

---

### Debugging

```javascript
// What engine?
getActiveEngine()

// What state?
getEngineState()

// Full dump
getActiveEngine().getInternalState()

// Reset
getActiveEngine().reset()
```

---

### Common Patterns

#### Component Listening to Swipes
```javascript
setup() {
  onMounted(() => {
    gestureBus.on(GestureType.SWIPE_MOVE, ({delta}) => {
      updatePosition(delta)
    })
  })
}
// Works with both engines!
```

#### Registering Touch Handler
```javascript
inputRegistry.registerTarget(element, {
  onPress: (event) => { /* ... */ },
  onSwipe: {
    left: (data) => { /* ... */ },
    right: (data) => { /* ... */ }
  }
})
// Works with both engines!
```

---

### Performance Notes

- **JS Engine**: Raw browser events, minimal processing overhead
- **Kotlin Engine**: Pre-processed by native, lower JS overhead
- Both maintain **same FSM state**, so app sees no difference
- Events filtered: Only elements in registry receive callbacks
- Gestures: Debounced at swipe threshold (8px)

---

### Troubleshooting

| Issue | Check |
|-------|-------|
| Events not firing | `getActiveEngine()` returns instance? Bridge attached? |
| Wrong axis | Kotlin calculating Math.abs correctly? |
| State stuck | `reset()` called on UP? |
| No events from Kotlin | `window.NativeBridge` defined? Called correctly? |
| Element not found | elementId correct? Registered in inputRegistry? |

---

### Next Actions

1. **Test JSEngine** - Run with `initInputRouter('js')`
2. **Set up Kotlin bridge** - Follow KOTLIN_BRIDGE_INTEGRATION.md
3. **Implement Kotlin** - Create Kotlin event sender
4. **Test both** - Verify identical event streams
5. **Deploy** - Use engine selector in production

---

### Documentation Files

- **COMPLETE_OVERVIEW.md** - Full architectural explanation
- **DUAL_ENGINE_SETUP.md** - Configuration & usage guide
- **MIGRATION_CHECKLIST.md** - Step-by-step migration
- **ENGINE_EXAMPLES.md** - Concrete code examples
- **ARCHITECTURE_COMPARISON.md** - Before/after diagrams
- **KOTLIN_BRIDGE_INTEGRATION.md** - Native bridge setup
- **QUICK_REFERENCE.md** - This file!
