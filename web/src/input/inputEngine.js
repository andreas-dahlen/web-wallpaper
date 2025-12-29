// input/inputEngine.js
import { ref } from 'vue'
import { APP_SETTINGS } from '../config/appSettings'
import { log } from './debugInput'

const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeThreshold
const SWIPE_THROTTLE = APP_SETTINGS.input.swipeThrottle
const MOVE_THRESHOLD = APP_SETTINGS.input.moveThreshold

export const state = {
  isPressed: ref(false),
  x: ref(0),
  y: ref(0)
}

// FSM
let fsmState = 'IDLE'
let pressCandidate = null
let swipeCandidate = null
let swipeAxis = null
let swipeStarted = false
let swipeAccum = 0

const start = { x: 0, y: 0 }
const last = { x: 0, y: 0 }

let lastSwipeTime = 0

// Registries
const pressCallbacks = new Map()
const releaseCallbacks = new Map()
const cancelCallbacks = new Map()
const swipeCallbacks = new WeakMap()

// -----------------------------------------------------------------------------
// Pointer handlers
// -----------------------------------------------------------------------------
function pointerDown(event) {
  log('input', 'FSMDown', '↓ DOWN', 'x=', event.clientX.toFixed(1), 'y=', event.clientY.toFixed(1))

  start.x = state.x.value = event.clientX
  start.y = state.y.value = event.clientY
  last.x = start.x
  last.y = start.y

  swipeAxis = null
  swipeAccum = 0
  swipeStarted = false
  swipeCandidate = null

  const elements = document.elementsFromPoint(event.clientX, event.clientY)
  pressCandidate = elements.find(el => pressCallbacks.has(el)) || null
  if (!pressCandidate) return

  fsmState = 'PRESS_PENDING'
  log('input', 'FSMDown', '→ PRESS_PENDING', pressCandidate)
  state.isPressed.value = true
  pressCallbacks.get(pressCandidate)?.forEach(fn => fn(event))
}

function pointerMove(event) {
  // Only update Vue state if moved enough
  if (Math.abs(state.x.value - event.clientX) > MOVE_THRESHOLD) state.x.value = event.clientX
  if (Math.abs(state.y.value - event.clientY) > MOVE_THRESHOLD) state.y.value = event.clientY

  if (fsmState !== 'PRESS_PENDING') return

  const dx = event.clientX - start.x
  const dy = event.clientY - start.y

  log('input', 'FSMMove', '↔ MOVE (pending)', 'dx=', dx.toFixed(1), 'dy=', dy.toFixed(1), 'threshold=', SWIPE_THRESHOLD)

  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return

  swipeAxis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
  log('input', 'FSMMove', '✅ Axis decided:', swipeAxis)

  if (swipeAxis === 'horizontal') last.x = start.x
  else last.y = start.y

  const originElements = document.elementsFromPoint(start.x, start.y)
  swipeCandidate = originElements.find(el => {
    const cfg = swipeCallbacks.get(el)
    return cfg && (cfg.axis === swipeAxis || cfg.axis === 'both')
  })
  if (!swipeCandidate) return

  // Cancel press
  cancelCallbacks.get(pressCandidate)?.forEach(fn => fn())
  pressCandidate = null
  fsmState = 'SWIPING'
  log('input', 'elTest', '🏁 → SWIPING', swipeCandidate)
}

function pointerMoveSwipe(event) {
  const now = performance.now()
  if (now - lastSwipeTime < SWIPE_THROTTLE) return
  lastSwipeTime = now

  if (fsmState !== 'SWIPING' || !swipeCandidate) return

  const cfg = swipeCallbacks.get(swipeCandidate)
  if (!cfg) return

  const stepDelta = swipeAxis === 'horizontal'
    ? event.clientX - last.x
    : event.clientY - last.y

  if (!isNaN(stepDelta)) swipeAccum += stepDelta

  if (!swipeStarted) {
    cfg.handlers?.onSwipeStart?.({ el: swipeCandidate, axis: swipeAxis })
    swipeStarted = true
  }

  const dirMap = {
    horizontal: stepDelta > 0 ? 'right' : 'left',
    vertical: stepDelta > 0 ? 'down' : 'up'
  }
  const dir = dirMap[swipeAxis]

  cfg.handlers[dir]?.({ el: swipeCandidate, delta: stepDelta, total: swipeAccum })

  if (swipeAxis === 'horizontal') last.x = event.clientX
  else last.y = event.clientY
}

function pointerUp(event) {
  if (fsmState === 'PRESS_PENDING' && pressCandidate) {
    releaseCallbacks.get(pressCandidate)?.forEach(fn => fn(event))
  }

  if (fsmState === 'SWIPING' && swipeCandidate) {
    const cfg = swipeCallbacks.get(swipeCandidate)
    cfg?.handlers?.onSwipeRelease?.({ el: swipeCandidate, total: swipeAccum })
  }

  reset()
}

function pointerCancel(event) { reset() }

function reset() {
  fsmState = 'IDLE'
  pressCandidate = swipeCandidate = null
  swipeAxis = null
  swipeAccum = 0
  swipeStarted = false
  state.isPressed.value = false
  last.x = last.y = 0
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function addCallback(map, el, fn) {
  if (!el || !fn) return
  if (!map.has(el)) map.set(el, new Set())
  map.get(el).add(fn)
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------
export const inputEngine = {
  state,
  _down: pointerDown,
  _move: pointerMove,
  _up: pointerUp,

  registerPressTarget(el, { onPress, onRelease, onPressCancel, onSwipeStart, onSwipeRelease, onSwipe = {} } = {}) {
    addCallback(pressCallbacks, el, onPress)
    addCallback(releaseCallbacks, el, onRelease)
    addCallback(cancelCallbacks, el, onPressCancel)

    const handlers = { ...onSwipe }
    if (onSwipeStart) handlers.onSwipeStart = onSwipeStart
    if (onSwipeRelease) handlers.onSwipeRelease = onSwipeRelease

    const hasH = handlers.left || handlers.right
    const hasV = handlers.up || handlers.down
    const axis = hasH && hasV ? 'both' : hasH ? 'horizontal' : hasV ? 'vertical' : null

    if (axis && !swipeCallbacks.has(el)) swipeCallbacks.set(el, { axis, handlers })
  },

  unregisterPressTarget(el) {
    if (!el) return
    pressCallbacks.delete(el)
    releaseCallbacks.delete(el)
    cancelCallbacks.delete(el)
    swipeCallbacks.delete(el)
  }
}

// -----------------------------------------------------------------------------
// Global listeners
window.addEventListener('pointerdown', pointerDown)
window.addEventListener('pointermove', e => (fsmState === 'SWIPING' ? pointerMoveSwipe(e) : pointerMove(e)))
window.addEventListener('pointerup', pointerUp)
window.addEventListener('pointercancel', pointerCancel)
