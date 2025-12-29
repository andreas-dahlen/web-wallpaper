// input/inputEngine.js
import { ref } from 'vue'
import { APP_SETTINGS } from '../config/appSettings'
import { log } from './debugInput'

const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeThreshold

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

// Registries
const pressCallbacks = new Map()
const releaseCallbacks = new Map()
const cancelCallbacks = new Map()
const swipeCallbacks = new WeakMap()

// -----------------------------------------------------------------------------
// Pointer handlers
// -----------------------------------------------------------------------------
function pointerDown(event) {

  log('input', 'FSM', 'DOWN → IDLE')

  start.x = state.x.value = event.clientX
  start.y = state.y.value = event.clientY

  swipeAxis = null
  swipeAccum = 0
  swipeStarted = false
  swipeCandidate = null

  const elements = document.elementsFromPoint(event.clientX, event.clientY)
  pressCandidate = elements.find(el => pressCallbacks.has(el)) || null
  if (!pressCandidate) {
    log('input', 'elTest', 'No press candidate')
    return
  }

  fsmState = 'PRESS_PENDING'
  log('input', 'FSM', '→ PRESS_PENDING', pressCandidate)
  state.isPressed.value = true
  pressCallbacks.get(pressCandidate)?.forEach(fn => fn(event))
}

function pointerMove(event) {
  state.x.value = event.clientX
  state.y.value = event.clientY

  if (fsmState !== 'PRESS_PENDING') return

  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) {
    log('input', 'FSM', 'Below threshold')
    return
  }
  swipeAxis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
  log('input', 'FSM', 'Axis decided:', swipeAxis)

  const originElements = document.elementsFromPoint(start.x, start.y)
  swipeCandidate = originElements.find(el => {
    const cfg = swipeCallbacks.get(el)
    return cfg && (cfg.axis === swipeAxis || cfg.axis === 'both')
  })
  if (!swipeCandidate) {
    log('input', 'elTest', 'No swipe candidate for axis', swipeAxis)
    return
  }
  // Cancel press
  cancelCallbacks.get(pressCandidate)?.forEach(fn => fn())
  pressCandidate = null
  fsmState = 'SWIPING'
  log('input', 'FSM', '→ SWIPING', swipeCandidate)
}

function pointerMoveSwipe(event) {
  if (fsmState !== 'SWIPING' || !swipeCandidate) return

  const cfg = swipeCallbacks.get(swipeCandidate)
  if (!cfg) return

  const delta = swipeAxis === 'horizontal'
    ? event.clientX - start.x
    : event.clientY - start.y

  swipeAccum += delta

    log(
    'input',
    'FSM',
    'MOVE',
    'delta:', delta,
    'total:', swipeAccum
  )

  if (!swipeStarted) {
    cfg.handlers?.onSwipeStart?.({ el: swipeCandidate, axis: swipeAxis })
    swipeStarted = true
    log('input', 'FSM', 'SWIPE START', swipeAxis)
  }

  // Call directional handler if exists
  const dirMap = {
    horizontal: delta > 0 ? 'right' : 'left',
    vertical: delta > 0 ? 'down' : 'up'
  }
  const dir = dirMap[swipeAxis]
  cfg.handlers[dir]?.({ el: swipeCandidate, delta, total: swipeAccum })

  start.x = event.clientX
  start.y = event.clientY

}

function pointerUp(event) {
  if (fsmState === 'PRESS_PENDING' && pressCandidate) {
    releaseCallbacks.get(pressCandidate)?.forEach(fn => fn(event))
  }

  if (fsmState === 'SWIPING' && swipeCandidate) {
    log(
      'input',
      'FSM',
      'SWIPE END',
      'total:', swipeAccum
    )
    const cfg = swipeCallbacks.get(swipeCandidate)
    cfg?.handlers?.onSwipeRelease?.({ el: swipeCandidate, total: swipeAccum })
  }

  reset()
}

function reset() {
  fsmState = 'IDLE'
  pressCandidate = swipeCandidate = null
  swipeAxis = null
  swipeAccum = 0
  swipeStarted = false
  state.isPressed.value = false
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

  // Expose internal handlers for nativeBridge
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
// Global listeners for browser (still works!)
window.addEventListener('pointerdown', pointerDown)
window.addEventListener('pointermove', e => (fsmState === 'SWIPING' ? pointerMoveSwipe(e) : pointerMove(e)))
window.addEventListener('pointerup', pointerUp)
