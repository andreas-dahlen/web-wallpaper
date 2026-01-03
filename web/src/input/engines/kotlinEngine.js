/**
 * Kotlin engine bridge for native gesture handling.
 * Implements the GestureEngine interface to behave identically to JSEngine.
 * 
 * This engine:
 * - Receives events from native Kotlin code
 * - Translates them to shared GestureType events on gestureBus
 * - Maintains the same FSM state as JS engine
 */
import { GestureEngine } from '../core/gestureEngine'
import { createGestureState, resetGestureState } from '../core/gestureState'
import { gestureBus } from '../bus/gestureBus'
import { GestureType } from '../bus/gestureTypes'
import { log } from '../debug/gestureDebug'

export class KotlinEngine extends GestureEngine {
  constructor() {
    super()
    this.state = createGestureState()
    this.nativeBridge = null // Will be injected if available
  }

  init(container = window) {
    // Kotlin engine doesn't listen to DOM events directly
    // Instead, it receives events via native bridge
    
    // Set up native bridge if available (e.g., window.NativeBridge or similar)
    if (typeof window !== 'undefined' && window.NativeBridge) {
      this.nativeBridge = window.NativeBridge
      
      // Register callbacks for native → JS communication
      this.nativeBridge.setGestureCallback?.((type, payload) => {
        this.handleNativeEvent(type, payload)
      })
      
      log('KotlinEngine', 'Initialized with native bridge')
    } else {
      log('KotlinEngine', 'No native bridge available, running in simulation mode')
    }
  }

  /**
   * Handle events from native Kotlin code
   * Payload includes: type, x, y, delta, total, axis, element reference, etc.
   */
  handleNativeEvent(eventType, payload) {
    switch (eventType) {
      case 'DOWN':
        this.onNativeDown(payload)
        break
      case 'MOVE':
        this.onNativeMove(payload)
        break
      case 'UP':
        this.onNativeUp(payload)
        break
      case 'CANCEL':
        this.onNativeCancel(payload)
        break
      default:
        log('KotlinEngine', 'Unknown native event:', eventType)
    }
  }

  /**
   * Implement GestureEngine.handle() for compatibility
   * (In practice, JS events won't reach here when using Kotlin engine)
   */
  handle(type, event) {
    log('KotlinEngine', 'handle() called (unexpected)', type)
    // Could forward to native if needed, but typically the native side
    // receives raw events and calls handleNativeEvent instead
  }

  // -------------------------
  // NATIVE EVENT HANDLERS
  // -------------------------
  onNativeDown(payload) {
    const { x, y, elementId } = payload
    const s = this.state

    s.start.x = s.last.x = x
    s.start.y = s.last.y = y
    s.swipeAxis = null
    s.swipeAccum = 0
    s.swipeStarted = false
    s.swipeCandidate = null

    // Native side resolves element by ID or reference
    s.pressCandidate = elementId || null

    if (!s.pressCandidate) return

    s.fsmState = 'PRESS_PENDING'
    gestureBus.emit(GestureType.PRESS_START, { x, y, elementId: s.pressCandidate })
    log('KotlinEngine', 'PRESS_START', x, y)
  }

  onNativeMove(payload) {
    const { x, y, elementId } = payload
    const s = this.state

    if (s.fsmState === 'SWIPING') {
      this.onNativeMoveSwipe(payload)
    } else if (s.fsmState === 'PRESS_PENDING') {
      s.last.x = x
      s.last.y = y

      const dx = x - s.start.x
      const dy = y - s.start.y
      const threshold = 8 // Match JS engine default

      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return

      if (!s.swipeAxis) {
        s.swipeAxis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
        if (s.swipeAxis === 'horizontal') s.last.x = s.start.x
        else s.last.y = s.start.y

        log('KotlinEngine', 'Axis decided:', s.swipeAxis)
      }

      // Native determines swipe candidate
      s.swipeCandidate = elementId || null
      if (!s.swipeCandidate) return

      s.fsmState = 'SWIPING'
      log('KotlinEngine', 'FSM state → SWIPING')
    }
  }

  onNativeMoveSwipe(payload) {
    const { x, y, delta, total, axis } = payload
    const s = this.state

    s.swipeAccum = total

    if (!s.swipeStarted) {
      gestureBus.emit(GestureType.SWIPE_START, { el: s.swipeCandidate, axis: s.swipeAxis })
      s.swipeStarted = true
      log('KotlinEngine', 'SWIPE_START', s.swipeAxis)
    }

    gestureBus.emit(GestureType.SWIPE_MOVE, { axis: s.swipeAxis, delta, total })

    if (s.swipeAxis === 'horizontal') s.last.x = x
    else s.last.y = y
  }

  onNativeUp(payload) {
    const s = this.state

    if (s.fsmState === 'SWIPING' && s.swipeCandidate) {
      gestureBus.emit(GestureType.SWIPE_END, { axis: s.swipeAxis, total: s.swipeAccum })
      log('KotlinEngine', 'SWIPE_END', s.swipeAccum)
    } else if (s.fsmState === 'PRESS_PENDING' && s.pressCandidate) {
      gestureBus.emit(GestureType.PRESS_END, { el: s.pressCandidate })
      log('KotlinEngine', 'PRESS_END')
    }

    this.reset()
  }

  onNativeCancel(payload) {
    log('KotlinEngine', 'CANCEL')
    this.reset()
  }

  // -------------------------
  // STATE QUERIES
  // -------------------------
  getState() {
    return this.state.fsmState
  }

  getInternalState() {
    return { ...this.state }
  }

  reset() {
    resetGestureState(this.state)
  }
}

export const kotlinEngine = new KotlinEngine()
