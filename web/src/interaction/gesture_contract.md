# Gesture Engine Contract

> **Purpose**: This document defines the authoritative contract for the gesture interaction engine. It exists to prevent architectural drift by both human contributors and AI coding assistants.

---

## System Purpose

This gesture engine implements a **unidirectional data pipeline** for handling touch/pointer interactions. The design is **intentionally over-structured** to enforce strict separation of concerns and prevent accidental coupling between layers.

**The pipeline transforms input as follows:**
```
Raw Input → Intent → Reaction Decision → State Mutation → Vue Render
```

Each layer has explicit knowledge boundaries. Violating these boundaries degrades maintainability and creates debugging nightmares.

---

## Pipeline Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INPUT LAYER                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐                │
│  │ inputRouter  │───▶│ intentMapper │───▶│ intentForwarder │                │
│  │              │    │              │    │                 │                │
│  │ Platform     │    │ State machine│    │ Routes to       │                │
│  │ wiring       │    │ (deltas)     │    │ intent layer    │                │
│  └──────────────┘    └──────────────┘    └────────┬────────┘                │
└──────────────────────────────────────────────────│─────────────────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTENT LAYER                                    │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────────┐           │
│  │ intentManager  │───▶│ intentResolver │───▶│ intentHelpers    │           │
│  │                │    │                │    │ (policy)         │           │
│  │ Gesture memory │    │ Resolve targets│    │ Target resolution│           │
│  └────────────────┘    └────────────────┘    └──────────────────┘           │
│          │                                                                   │
│          ▼                                                                   │
│  ┌───────────────┐     ┌────────────────┐                                   │
│  │ buildPayload  │────▶│ domRegistry    │ (read-only DOM queries)           │
│  │               │     └────────────────┘                                   │
│  │ Creates       │                                                          │
│  │ descriptors   │                                                          │
│  └───────┬───────┘                                                          │
└──────────│──────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REACTION LAYER                                     │
│  ┌─────────────────┐    ┌─────────────┐    ┌────────────────┐               │
│  │ reactionManager │───▶│ XSolver     │───▶│ XPolicy        │               │
│  │                 │    │             │    │                │               │
│  │ Routes to       │    │ Decisions   │    │ Pure math      │               │
│  │ solvers         │    │ (commit/rev)│    │ (clamp/quant)  │               │
│  └─────────────────┘    └─────────────┘    └────────────────┘               │
│          │                                                                   │
│          ▼                                                                   │
│  ┌────────────────┐                                                         │
│  │ dispatcher     │                                                         │
│  │                │                                                         │
│  │ Applies to     │                                                         │
│  │ state + DOM    │                                                         │
│  └───────┬────────┘                                                         │
└──────────│──────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             STATE LAYER                                      │
│  ┌──────────────┐    ┌───────────────────────────────────────┐              │
│  │ stateManager │───▶│ carouselState / sliderState / dragState│             │
│  │              │    │                                       │              │
│  │ Routes       │    │ Owns mutable truth:                   │              │
│  │ to types     │    │ - value, offset, dragging, bounds     │              │
│  └──────────────┘    └───────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            VUE COMPONENTS                                    │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐             │
│  │ SwipeCarousel  │    │ SwipeSlider    │    │ SwipeDrag      │             │
│  │                │    │                │    │                │             │
│  │ Reads state    │    │ Reads state    │    │ Reads state    │             │
│  │ Renders        │    │ Renders        │    │ Renders        │             │
│  └────────────────┘    └────────────────┘    └────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Contracts

### 1. Input Layer

**Files:** `inputRouter.js`, `intentMapper.js`, `intentForwarder.js`

#### Responsibilities
- Wire platform-specific input sources (browser pointer events, Android touch bridge)
- Maintain gesture state machine: `IDLE` → `PENDING` → `SWIPING`
- Compute raw deltas (x, y pixels)
- Detect axis (horizontal/vertical)
- Detect gesture lifecycle (press, swipe-start, swipe, commit, release)
- Forward structured intents to the intent layer

#### Allowed Knowledge
- Raw pointer coordinates (x, y)
- Platform detection (Android vs browser)
- Gesture phase (IDLE, PENDING, SWIPING)
- Accumulated delta from gesture start
- Swipe threshold for axis lock

#### Forbidden Knowledge
- ❌ Lane IDs or lane configuration
- ❌ Carousel/slider/drag semantics
- ❌ Value bounds (min, max)
- ❌ Component state (value, offset, dragging)
- ❌ DOM elements beyond event sourcing
- ❌ CSS or visual rendering

#### Correct Usage Example
```javascript
// intentMapper.js - Computing raw delta
const deltaX = x - state.last.x
state.totalDelta.x += deltaX

intentForward({
  type: 'swipe',
  delta: state.totalDelta  // raw pixels only
})
```

#### Violation Examples
```javascript
// ❌ WRONG: Referencing lane concepts
if (laneState.dragging) return  // NO! Don't know about lanes

// ❌ WRONG: Importing state
import { sliderState } from '../state/sliderState'  // NO!

// ❌ WRONG: Clamping values
const clamped = Math.max(min, delta)  // NO! Policy's job
```

---

### 2. Intent Layer

**Files:** `intentManager.js`, `intentResolver.js`, `intentHelpers.js`, `buildPayload.js`, `domRegistry.js`

#### Responsibilities
- Maintain gesture target memory (which element owns the gesture)
- Resolve targets using DOM queries (`domRegistry`)
- Build immutable descriptors with lane context
- Validate axis compatibility between intent and target
- Route intents through resolver → payload builder

#### Allowed Knowledge
- Current gesture target (element, laneId, swipeType)
- DOM data-* attributes (read-only)
- Raw delta from input layer
- Axis (horizontal, vertical, both)
- Whether a target supports a reaction type

#### Forbidden Knowledge
- ❌ Commit/revert logic
- ❌ Delta clamping or quantization
- ❌ Logical value computation
- ❌ Transition animations
- ❌ Direct state mutation

#### Correct Usage Example
```javascript
// intentHelpers.js - Resolving target support
resolveSupports(type, target) {
  return !!target?.reactions?.[type]  // just checks capability
}

// buildPayload.js - Reading state for descriptor (allowed)
laneSize: state.getSize(current.swipeType, current.laneId),
min: state.getMin(current.swipeType, current.laneId),
```

#### Violation Examples
```javascript
// ❌ WRONG: Clamping delta
const clamped = Math.min(max, delta)  // NO! Policy's job

// ❌ WRONG: Deciding commit vs revert
if (delta > threshold) commit()  // NO! Solver's job

// ❌ WRONG: Mutating state
sliderState.value = newValue  // NO! Dispatcher's job
```

---

### 3. DOM Registry

**File:** `domRegistry.js`

#### Responsibilities
- Query DOM for elements at coordinates
- Read data-* attributes from elements
- Build capability maps (reactions object)
- Never mutate DOM, never trigger callbacks

#### Allowed Knowledge
- DOM element positions
- data-* attributes
- Computed capability flags (pressable, swipeable, etc.)

#### Forbidden Knowledge
- ❌ Gesture state
- ❌ Lane values or offsets
- ❌ Any mutable state
- ❌ Reaction dispatch

#### Correct Usage Example
```javascript
// Reading DOM attributes - correct
const laneId = ds.lane || null
const axis = ds.axis || null
const swipeType = ds.swipeType || null
```

#### Violation Examples
```javascript
// ❌ WRONG: Mutating DOM
el.setAttribute('data-active', true)  // NO! Dispatcher's job

// ❌ WRONG: Dispatching events
el.dispatchEvent(new CustomEvent('reaction'))  // NO!
```

---

### 4. Policy Layer (Pure Logic)

**Files:** `carouselPolicy.js`, `sliderPolicy.js`, `dragPolicy.js`

#### Responsibilities
- Contain ONLY pure functions
- Convert pixel deltas to logical values
- Clamp values to bounds
- Quantize to step boundaries
- Resolve direction from delta
- Determine commit thresholds

#### Allowed Knowledge
- Input parameters only (delta, laneSize, min, max, etc.)
- Configuration constants

#### Forbidden Knowledge
- ❌ State (reactive or otherwise)
- ❌ DOM
- ❌ Side effects of any kind
- ❌ Imports from state modules
- ❌ Imports from Vue

#### Correct Usage Example
```javascript
// Pure function - correct
export function clampDelta(delta, laneSize) {
  if (!laneSize) return delta
  return Math.max(-laneSize, Math.min(laneSize, delta))
}

export function shouldCommit(delta, laneSize) {
  const threshold = laneSize * APP_SETTINGS.swipeCommitRatio
  return Math.abs(delta) >= threshold
}
```

#### Violation Examples
```javascript
// ❌ WRONG: Importing state
import { carouselState } from '../../state/carouselState'

// ❌ WRONG: Reading reactive values
const value = carouselState.lanes[laneId].value  // NO!

// ❌ WRONG: Side effects
console.log('Clamping...')  // NO! (even logging)
element.style.transform = ...  // NO!
```

---

### 5. Solver Layer

**Files:** `carouselSolver.js`, `sliderSolver.js`, `dragSolver.js`

#### Responsibilities
- Receive descriptors from reactionManager
- Use policy functions for pure math
- Produce reaction payloads (what should happen)
- Decide commit vs revert (carousel)
- Convert pixel to logical deltas (slider)
- Augment descriptors with computed values

#### Allowed Knowledge
- Descriptor contents (delta, laneSize, min, max, value, axis)
- Policy function results
- Reaction type names

#### Forbidden Knowledge
- ❌ Direct state access (`state.ensure()`, `sliderState.value`)
- ❌ DOM access
- ❌ Dispatching events
- ❌ Vue reactivity

#### Correct Usage Example
```javascript
// Using policy, augmenting descriptor - correct
swipe(desc) {
  const { delta, laneSize } = desc
  const clampedDelta = clampDelta(delta, laneSize)
  
  desc.reaction = desc.type
  desc.delta = clampedDelta
  return desc
}
```

#### Violation Examples
```javascript
// ❌ WRONG: Accessing state directly
const value = state.getValue('slider', desc.laneId)  // NO!

// ❌ WRONG: Mutating state
sliderState.sliders[laneId].value = newValue  // NO!

// ❌ WRONG: Calling ensure
const lane = state.ensure('carousel', laneId)  // NO!
```

---

### 6. Dispatcher

**File:** `dispatcher.js`

#### Responsibilities
- Single choke point for applying reactions
- Call state mutation functions
- Set DOM attributes (data-pressed, data-swiping)
- Dispatch custom events to elements
- NO decision logic

#### Allowed Knowledge
- Descriptor contents
- State mutation function names
- DOM attribute names

#### Forbidden Knowledge
- ❌ Commit/revert decision logic
- ❌ Delta clamping
- ❌ Value computation
- ❌ Policy functions

#### Correct Usage Example
```javascript
// Applying state and DOM updates - correct
if (descriptor.reaction) {
  state.swipe(swipeType, desc)  // delegate to state
}
setAttr(el, 'data-swiping', true)  // DOM attribute
dispatchEvent(el, descriptor)  // notify component
```

#### Violation Examples
```javascript
// ❌ WRONG: Decision logic
if (delta > threshold) {
  descriptor.reaction = 'commit'  // NO! Solver's job
}

// ❌ WRONG: Math
const clamped = Math.min(max, delta)  // NO!
```

---

### 7. State Layer

**Files:** `stateManager.js`, `carouselState.js`, `sliderState.js`, `dragState.js`

#### Responsibilities
- Own ALL mutable truth
- Expose getters for current values
- Receive mutation calls from dispatcher
- Apply solver output to state
- Reset transient gesture state on commit
- May use policy helpers for index computation

#### Allowed Knowledge
- Own state values (value, offset, dragging, bounds)
- Lane identifiers
- Policy helpers (for things like `getNextIndex`)

#### Forbidden Knowledge
- ❌ Descriptor building
- ❌ Target resolution
- ❌ DOM queries
- ❌ Input handling
- ❌ Solver logic (commit vs revert decision)

#### Correct Usage Example
```javascript
// State mutation - correct
swipeCommit(desc) {
  const slider = this.ensure(desc.laneId)
  slider.value = Math.min(slider.max, Math.max(slider.min, slider.value + desc.delta))
  slider.offset = 0
  slider.dragging = false
}
```

#### Violation Examples
```javascript
// ❌ WRONG: Decision logic
if (shouldCommit(delta, laneSize)) {  // NO! Solver already decided
  this.commit()
}

// ❌ WRONG: DOM access
const el = document.querySelector(`[data-lane="${laneId}"]`)  // NO!
```

---

### 8. Vue Components

**Files:** `SwipeCarousel.vue`, `SwipeSlider.vue`, `SwipeDrag.vue`, `InputElement.vue`

#### Responsibilities
- Declare gestures via data-* attributes
- Read state for rendering (value, offset, dragging)
- Map logical values to pixel positions
- Apply CSS transforms for visual feedback
- Listen for `reaction` events from dispatcher
- Emit Vue events to parent components
- Call `state.ensure()` and `state.setSize()` for initialization

#### Allowed Knowledge
- Lane state (via computed properties)
- Own DOM element dimensions
- CSS transform syntax
- Transition timing

#### Forbidden Knowledge
- ❌ Gesture math (delta computation)
- ❌ Clamping logic
- ❌ Commit/revert decisions
- ❌ Policy or solver internals
- ❌ Other components' state
- ❌ Direct input event handling

#### Correct Usage Example
```javascript
// Mapping logical to pixel - correct
const thumbStyle = computed(() => {
  const posRatio = (laneValue.value - laneMin.value) / (laneMax.value - laneMin.value)
  const pos = posRatio * laneSize.value + laneOffset.value
  
  return {
    transform: `translate3d(${pos}px,0,0)`
  }
})
```

#### Violation Examples
```javascript
// ❌ WRONG: Doing gesture math
const newPos = startPos.x + (event.clientX - gestureStart.x)  // NO!

// ❌ WRONG: Clamping
const clamped = Math.max(min, Math.min(max, value))  // NO!

// ❌ WRONG: Commit decision
if (velocity > threshold) commit()  // NO!

// ❌ WRONG: Direct input handling
el.addEventListener('pointermove', handleMove)  // NO!
```

---

## Descriptor Contract

Descriptors are the data packets that flow through the pipeline.

### Properties
- **Immutable at creation**: buildPayload creates a snapshot
- **Augmented by solvers**: Solvers may add computed fields
- **Disposable**: Each gesture event creates a new descriptor
- **Never mutated in-place by later stages**: Clone if needed

### Required Fields
```typescript
interface Descriptor {
  type: 'press' | 'pressRelease' | 'pressCancel' | 'swipeStart' | 'swipe' | 'swipeCommit' | 'swipeRevert'
  element: HTMLElement
  delta: number | { x: number, y: number }
  laneId: string | null
  swipeType: 'carousel' | 'slider' | 'drag' | null
  axis: 'horizontal' | 'vertical' | 'both' | null
  laneSize: number | null
  min: number | null
  max: number | null
  value: number | null
}
```

### Solver-Added Fields
```typescript
interface SolverAugmentation {
  reaction: string      // what state action to take
  direction?: string    // 'left' | 'right' | 'up' | 'down'
}
```

---

## DO NOT Rules (Summary)

### Input Layer
- DO NOT import state modules
- DO NOT reference lane concepts
- DO NOT clamp or transform values

### Intent Layer
- DO NOT make commit/revert decisions
- DO NOT mutate state
- DO NOT do gesture math beyond delta extraction

### Policy Layer
- DO NOT import state or Vue
- DO NOT have side effects
- DO NOT access DOM

### Solver Layer
- DO NOT access state directly
- DO NOT call `state.ensure()`
- DO NOT dispatch events

### State Layer
- DO NOT make commit decisions (already decided by solver)
- DO NOT access DOM
- DO NOT build descriptors

### Vue Components
- DO NOT do gesture math
- DO NOT clamp values
- DO NOT handle input events directly
- DO NOT access solver/policy internals

---

## For AI Assistants

When modifying this codebase:

1. **Identify the layer** before making changes
2. **Check the contract** for that layer's allowed/forbidden knowledge
3. **Never add imports** that violate layer boundaries
4. **When in doubt**, keep logic in the lower layer (prefer policy over solver, solver over state)
5. **Pure functions are sacred** - policies must remain pure
6. **Descriptors flow down** - never pass reactive state through the pipeline

If a feature requires knowledge from a forbidden source, the architecture may need extension, not violation. Consult the system overview before proceeding.

---

## Version History

| Date | Change |
|------|--------|
| 2026-02-07 | Initial contract formalization |
