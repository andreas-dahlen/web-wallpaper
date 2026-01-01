// input/drivers/unifiedInputDriver.js
import { inputRegistry } from '../core/inputRegistry'
import { gestureBus } from '../bus/gestureBus'
import { GestureType } from '../bus/gestureTypes'
import { debugLagTime, drawDot, log } from '../debug/inputDebug'
import { APP_SETTINGS } from '../../config/appSettings'

export const unifiedInputDriver = {
  fsmState: 'IDLE', // IDLE | PRESS_PENDING | SWIPING
  pressCandidate: null,
  swipeCandidate: null,
  swipeAxis: null,
  swipeAccum: 0,
  swipeStarted: false,
  start: { x: 0, y: 0 },
  last: { x: 0, y: 0 },

  // -------------------------
  // INIT
  // -------------------------
  init(container = window) {
    container.addEventListener('pointerdown', e => this.handle('down', e))
    container.addEventListener('pointermove', e => this.handle('move', e))
    container.addEventListener('pointerup', e => this.handle('up', e))
    container.addEventListener('pointercancel', () => this.pointerCancel())
  },

  // -------------------------
  // HANDLE
  // -------------------------
  handle(type, event) {
    switch (type) {
      case 'down': this.pointerDown(event); break
      case 'move':
        if (this.fsmState === 'SWIPING') this.pointerMoveSwipe(event)
        else this.pointerMove(event)
        break
      case 'up': this.pointerUp(event); break
      default: console.warn('Unknown input type:', type)
    }
  },

  // -------------------------
  // POINTER DOWN
  // -------------------------
  pointerDown(event) {
    const { clientX: x, clientY: y } = event
    this.start.x = this.last.x = x
    this.start.y = this.last.y = y

    this.swipeAxis = null
    this.swipeAccum = 0
    this.swipeStarted = false
    this.swipeCandidate = null

    const elements = document.elementsFromPoint(x, y)
    this.pressCandidate = elements.find(el => inputRegistry.hasTarget(el)) || null

    log('elTest', 'pressCandidate', this.pressCandidate)


    if (!this.pressCandidate) return

    this.fsmState = 'PRESS_PENDING'
    inputRegistry.triggerPress(this.pressCandidate, event)

    gestureBus.emit(GestureType.PRESS_START, { x, y, el: this.pressCandidate })
    drawDot(x, y, 'lime')
    debugLagTime('down')

    log('FSMDown', '↓ DOWN', x, y)
    log('elTest', 'Elements at pointerDown:', elements)
    log('swipeFSM', 'FSM state → PRESS_PENDING')
  },

  // -------------------------
  // POINTER MOVE (DECIDE SWIPE)
  // -------------------------
  pointerMove(event) {
    if (this.fsmState !== 'PRESS_PENDING') return
    const { clientX: x, clientY: y } = event
    this.last.x = x
    this.last.y = y

    const dx = x - this.start.x
    const dy = y - this.start.y

    const threshold = APP_SETTINGS.input.swipeThreshold || 8
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return

    if (!this.swipeAxis) {
      this.swipeAxis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
      if (this.swipeAxis === 'horizontal') this.last.x = this.start.x
      else this.last.y = this.start.y

      debugLagTime('axisDecided')
      log('swipeFSM', 'Axis decided:', this.swipeAxis)
    }

    const originElements = document.elementsFromPoint(this.start.x, this.start.y)
    this.swipeCandidate = originElements.find(el => inputRegistry.hasSwipe(el, this.swipeAxis))

    log('elTest', 'swipeCandidate', this.swipeCandidate)

    if (!this.swipeCandidate) return

    inputRegistry.triggerCancel(this.pressCandidate)
    this.pressCandidate = null
    this.fsmState = 'SWIPING'

    log('swipeFSM', 'Swipe candidate found:', this.swipeCandidate)
    log('swipeFSM', 'FSM state → SWIPING')

    this.pointerMoveSwipe(event)
  },

  // -------------------------
  // POINTER MOVE (ACTIVE SWIPE)
  // -------------------------
  pointerMoveSwipe(event) {
    if (this.fsmState !== 'SWIPING' || !this.swipeCandidate) return
    const { clientX: x, clientY: y } = event

    const cfg = inputRegistry.getSwipeConfig(this.swipeCandidate)
    if (!cfg) return

    const stepDelta = this.swipeAxis === 'horizontal' ? x - this.last.x : y - this.last.y
    if (!stepDelta) return

    this.swipeAccum += stepDelta

    if (!this.swipeStarted) {
      this.swipeStarted = true
      cfg.handlers.onSwipeStart?.({ el: this.swipeCandidate, axis: this.swipeAxis })
      gestureBus.emit(GestureType.SWIPE_START, { el: this.swipeCandidate, axis: this.swipeAxis })
      log('swipeFSM', '🌟 SWIPE START', this.swipeAxis)
    }

    const dir = this.swipeAxis === 'horizontal'
      ? stepDelta > 0 ? 'right' : 'left'
      : stepDelta > 0 ? 'down' : 'up'

    cfg.handlers[dir]?.({ el: this.swipeCandidate, dir, delta: stepDelta, total: this.swipeAccum })

    gestureBus.emit(GestureType.SWIPE_MOVE, {
      el: this.swipeCandidate,
      axis: this.swipeAxis,
      delta: stepDelta,
      total: this.swipeAccum
    })

    if (this.swipeAxis === 'horizontal') this.last.x = x
    else this.last.y = y

    drawDot(x, y, 'orange')
    debugLagTime('move')

    log('swipeMoves', 'SWIPE MOVE', dir, stepDelta, this.swipeAccum)

    log('elTest', 'active swipeCandidate', this.swipeCandidate)
  },

  // -------------------------
  // POINTER UP
  // -------------------------
  pointerUp(event) {
    const { clientX: x, clientY: y } = event

    if (this.fsmState === 'PRESS_PENDING' && this.pressCandidate) {
      inputRegistry.triggerRelease(this.pressCandidate, event)
      gestureBus.emit(GestureType.PRESS_END, { x, y, el: this.pressCandidate })
    }

    if (this.fsmState === 'SWIPING' && this.swipeCandidate) {
      const cfg = inputRegistry.getSwipeConfig(this.swipeCandidate)
      cfg?.handlers.onSwipeRelease?.({ el: this.swipeCandidate, total: this.swipeAccum })

      gestureBus.emit(GestureType.SWIPE_END, {
        el: this.swipeCandidate,
        axis: this.swipeAxis,
        total: this.swipeAccum
      })

      drawDot(x, y, 'red')
    }

    this.reset()
    log('FSMDown', '↑ UP', x, y)
    log('swipeFSM', 'FSM state → IDLE')
    debugLagTime('up')
  },

  // -------------------------
  // CANCEL
  // -------------------------
  pointerCancel() {
    log('FSMDown', '❌ CANCEL → IDLE')
    if (this.pressCandidate) inputRegistry.triggerCancel(this.pressCandidate)
    this.reset()
    log('swipeFSM', 'FSM state → IDLE (cancelled)')
  },

  reset() {
    this.fsmState = 'IDLE'
    this.pressCandidate = null
    this.swipeCandidate = null
    this.swipeAxis = null
    this.swipeAccum = 0
    this.swipeStarted = false
    this.start.x = this.start.y = 0
    this.last.x = this.last.y = 0
  }
}
