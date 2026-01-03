/**
 * JavaScript implementation of the gesture engine.
 * This contains all your current unifiedInputDriver logic.
 */
import { GestureEngine } from '../core/gestureEngine'
import { createGestureState, resetGestureState } from '../core/gestureState'
import { gestureTargetRegistry } from '../core/gestureTargetRegistry'
import { gestureBus } from '../bus/gestureBus'
import { GestureType } from '../bus/gestureTypes'
import { debugLagTime, drawDot, log } from '../debug/gestureDebug'
import { APP_SETTINGS } from '../../config/appSettings'
import { DEBUG } from '../../config/appSettings'

export class JSEngine extends GestureEngine {
  constructor() {
    super()
    this.state = createGestureState()
  }

  init(container = window) {
    container.addEventListener('pointerdown', e => this.handle('down', e))
    container.addEventListener('pointermove', e => this.handle('move', e))
    container.addEventListener('pointerup', e => this.handle('up', e))
    container.addEventListener('pointercancel', () => this.pointerCancel())
  }

  handle(type, event) {
    switch (type) {
      case 'down': this.pointerDown(event); break
      case 'move':
        if (this.state.fsmState === 'SWIPING') this.pointerMoveSwipe(event)
        else this.pointerMove(event)
        break
      case 'up': this.pointerUp(event); break
      default: console.warn('Unknown input type:', type)
    }
  }

  // -------------------------
  // POINTER DOWN
  // -------------------------
  pointerDown(event) {
    const { clientX: x, clientY: y } = event
    this.state.start.x = this.state.last.x = x
    this.state.start.y = this.state.last.y = y

    this.state.swipeAxis = null
    this.state.swipeAccum = 0
    this.state.swipeStarted = false
    this.state.swipeCandidate = null

    const elements = document.elementsFromPoint(x, y)
    this.state.pressCandidate = elements.find(el => gestureTargetRegistry.hasTarget(el)) || null

    if (!this.state.pressCandidate) return

    this.state.fsmState = 'PRESS_PENDING'
    gestureTargetRegistry.triggerPress(this.state.pressCandidate, event)

    gestureBus.emit(GestureType.PRESS_START, { x, y, el: this.state.pressCandidate })
    drawDot(x, y, 'lime')
    debugLagTime('down')

    log('fsmTransitions', '↓ PRESS_PENDING', { x, y, el: this.state.pressCandidate })
    log('elementMatching', 'Matched element:', this.state.pressCandidate)
  }

  // -------------------------
  // POINTER MOVE (DECIDE SWIPE)
  // -------------------------
  pointerMove(event) {
    if (this.state.fsmState !== 'PRESS_PENDING') return
    const { clientX: x, clientY: y } = event
    this.state.last.x = x
    this.state.last.y = y

    const dx = x - this.state.start.x
    const dy = y - this.state.start.y

    const threshold = APP_SETTINGS.input.swipeThreshold || 8
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return

    if (!this.state.swipeAxis) {
      this.state.swipeAxis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
      if (this.state.swipeAxis === 'horizontal') this.state.last.x = this.state.start.x
      else this.state.last.y = this.state.start.y

      debugLagTime('axisDecided')
      log('fsmTransitions', 'Axis determined:', this.state.swipeAxis)
    }

    const originElements = document.elementsFromPoint(this.state.start.x, this.state.start.y)
    this.state.swipeCandidate = originElements.find(el => gestureTargetRegistry.hasSwipe(el, this.state.swipeAxis)) || null

    log('elementMatching', 'Swipe candidate:', this.state.swipeCandidate, 'axis:', this.state.swipeAxis)
    
    if (!this.state.swipeCandidate) return

    this.state.fsmState = 'SWIPING'
    log('fsmTransitions', '→ SWIPING', this.state.swipeAxis)
  }

  // -------------------------
  // POINTER MOVE (SWIPING)
  // -------------------------
  pointerMoveSwipe(event) {
    const s = this.state
    const { clientX: x, clientY: y } = event

    const stepDelta = s.swipeAxis === 'horizontal'
      ? x - s.last.x
      : y - s.last.y

    s.swipeAccum += stepDelta

    if (!s.swipeStarted) {
      const cfg = gestureTargetRegistry.getSwipeConfig(s.swipeCandidate)
      cfg?.handlers?.onSwipeStart?.({ el: s.swipeCandidate, axis: s.swipeAxis })
      gestureBus.emit(GestureType.SWIPE_START, { el: s.swipeCandidate, axis: s.swipeAxis })
      s.swipeStarted = true
      log('fsmTransitions', 'SWIPE START', s.swipeAxis)
    }

    const cfg = gestureTargetRegistry.getSwipeConfig(s.swipeCandidate)
    const dirMap = {
      horizontal: stepDelta > 0 ? 'right' : 'left',
      vertical: stepDelta > 0 ? 'down' : 'up'
    }
    const dir = dirMap[s.swipeAxis]
    cfg?.handlers[dir]?.({ el: s.swipeCandidate, delta: stepDelta, total: s.swipeAccum })
    gestureBus.emit(GestureType.SWIPE_MOVE, { axis: s.swipeAxis, delta: stepDelta, total: s.swipeAccum })

    log('fsmMove', 'move', { delta: stepDelta, total: s.swipeAccum, dir })
    log('swipeMovement', `${s.swipeAxis} ${dir}`, { delta: stepDelta, accum: s.swipeAccum })

    if (s.swipeAxis === 'horizontal') s.last.x = x
    else s.last.y = y
  }

  // -------------------------
  // POINTER UP
  // -------------------------
  pointerUp(event) {
    const s = this.state

    if (s.fsmState === 'SWIPING' && s.swipeCandidate) {
      const cfg = gestureTargetRegistry.getSwipeConfig(s.swipeCandidate)
      cfg?.handlers?.onSwipeRelease?.({ el: s.swipeCandidate, total: s.swipeAccum })
      gestureBus.emit(GestureType.SWIPE_END, { axis: s.swipeAxis, total: s.swipeAccum })
      log('fsmTransitions', 'SWIPE END', { axis: s.swipeAxis, total: s.swipeAccum })
    } else if (s.fsmState === 'PRESS_PENDING' && s.pressCandidate) {
      gestureTargetRegistry.triggerRelease(s.pressCandidate, event)
      gestureBus.emit(GestureType.PRESS_END, { el: s.pressCandidate })
      log('fsmTransitions', 'PRESS END')
    }

    this.reset()
  }

  // -------------------------
  // POINTER CANCEL
  // -------------------------
  pointerCancel() {
    const s = this.state
    if (s.pressCandidate) {
      gestureTargetRegistry.triggerCancel(s.pressCandidate)
    }
    log('fsmTransitions', 'POINTER CANCEL')
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

export const jsEngine = new JSEngine()
