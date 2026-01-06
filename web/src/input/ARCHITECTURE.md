# Gesture System - Refactored

## Overview

Simplified, high-performance gesture handling for the Android WebView wallpaper. This refactored system replaces 10+ files with a single unified handler.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         KOTLIN                                   │
├─────────────────────────────────────────────────────────────────┤
│  WebWallpaperService.kt                                         │
│  ├── Touch events → normalize coords → sendToJS()               │
│  ├── Hardware acceleration enabled                              │
│  └── On-demand rendering (not constant 60fps)                   │
│                                                                 │
│  evaluateJavascript("handleTouch('type', x, y, seqId)")        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       JAVASCRIPT                                 │
├─────────────────────────────────────────────────────────────────┤
│  gestureHandler.js                                              │
│  ├── Single file handles both Android + Browser                 │
│  ├── Simple state: IDLE → PENDING → SWIPING                    │
│  ├── Axis locking (only tracks locked axis after threshold)    │
│  └── Direct calls to swipeState (no event bus)                  │
│                                                                 │
│  State changes:                                                 │
│  ├── handleDown() → find lane, set PENDING                      │
│  ├── handleMove() → detect axis, track delta, update offset     │
│  └── handleUp() → commit or reject swipe                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VUE COMPONENTS                              │
├─────────────────────────────────────────────────────────────────┤
│  SwipeCarousel.vue                                              │
│  ├── Watches swipeState.lanes[laneId].offset                    │
│  ├── CSS transition: none during drag, eased on release         │
│  ├── GPU compositing: translate3d, will-change, contain         │
│  └── transitionend → commit index change                        │
│                                                                 │
│  SwipeZones.vue                                                 │
│  └── Simple divs with data-lane attribute (no handlers)         │
└─────────────────────────────────────────────────────────────────┘
```

## Key Performance Optimizations

### Kotlin Side
1. **Hardware acceleration**: `setLayerType(LAYER_TYPE_HARDWARE, null)`
2. **Move throttling**: 16ms (~60fps) instead of 8ms
3. **No momentum IPC**: Removed SwipeEngine momentum (CSS handles animations)
4. **On-demand rendering**: Only redraws when needed

### JavaScript Side
1. **Single DOM query**: Lane element cached for entire gesture
2. **Axis locking**: Only tracks the locked axis after threshold detection
3. **No event bus**: Direct function calls eliminate overhead
4. **Minimal state**: 5 properties vs 15+ in old system

### CSS Side
1. **translate3d()**: Forces GPU compositing layer
2. **will-change: transform**: Hints browser for optimization
3. **contain: layout style paint**: Prevents layout thrashing
4. **Transition toggle**: `none` during drag, eased on release

## Old Files (No Longer Needed)

The refactored system replaces these files with `gestureHandler.js`:

| Old File | Status |
|----------|--------|
| `core/gestureEngine.js` | Removed - abstract class unused |
| `core/androidGestureAdapter.js` | Merged into gestureHandler |
| `core/gestureEngineRouter.js` | Removed - no routing needed |
| `core/gestureState.js` | Removed - state is local |
| `core/gestureTargetRegistry.js` | Removed - uses data-lane |
| `core/carouselGestureController.js` | Merged into gestureHandler |
| `engines/jsEngine.js` | Merged into gestureHandler |
| `bus/gestureBus.js` | Removed - direct calls |
| `bus/gestureTypes.js` | Removed - no event types |
| `bootstrap/initAndroidBridge.js` | Merged into gestureHandler |
| `bootstrap/initInputSystem.js` | Replaced by single init call |

## Usage

```javascript
// In main.js
import { initGestureHandler } from './input/gestureHandler'

// After Vue mounts
initGestureHandler()
```

The handler auto-detects Android vs Browser mode based on `typeof Android`.

## Swipe Zone Configuration

Zones are defined in `SwipeZones.vue` with `data-lane` attributes:

```html
<div data-lane="top" class="swipe-zone" />
<div data-lane="mid" class="swipe-zone" />
<div data-lane="bottom" class="swipe-zone" />
<div data-lane="wallpaper" class="swipe-zone" />
```

The gesture handler finds these via `document.elementsFromPoint()`.

## Lane Axis Rules

| Lane | Allowed Axis |
|------|--------------|
| `wallpaper` | vertical (up/down) |
| `top`, `mid`, `bottom` | horizontal (left/right) |

This is defined in `isAxisSupported()` function.

## Gesture Flow

```
1. DOWN → Cache lane element, set state to PENDING
2. MOVE (< threshold) → Ignore
3. MOVE (≥ threshold) → Lock axis, set state to SWIPING
4. MOVE (swiping) → Update offset in locked axis only
5. UP (|delta| > commitThreshold) → Commit swipe, CSS animates
6. UP (|delta| ≤ commitThreshold) → Reject, snap back
```

## Debug Mode

Set `DEBUG_ENABLED = true` in `gestureHandler.js` to enable logging:

```javascript
const DEBUG_ENABLED = true // Enable for development
```
