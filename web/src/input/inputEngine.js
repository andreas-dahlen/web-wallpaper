import { ref } from 'vue'
import { APP_SETTINGS } from '../config/appSettings'

const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeThreshold

export const state = {
  isPressed: ref(false),
  x: ref(0),
  y: ref(0)
}

// FSM
let fsmState = 'IDLE' // IDLE | PRESS_PENDING | SWIPING

let pressCandidate = null
let swipeCandidate = null
let swipeAxis = null
let swipeDir = null

const start = { x: 0, y: 0 }
let swipeAccum = 0
let swipeStarted = false

// Registries
const pressCallbacks = new Map()
const releaseCallbacks = new Map()
const cancelCallbacks = new Map()
const swipeCallbacks = new WeakMap()

// -----------------------------------------------------------------------------
// Pointer handlers
// -----------------------------------------------------------------------------
function pointerDown(event) {
  start.x = state.x.value = event.clientX
  start.y = state.y.value = event.clientY

  swipeAxis = swipeDir = null
  swipeAccum = 0
  swipeStarted = false

  const elements = document.elementsFromPoint(event.clientX, event.clientY)
  pressCandidate = elements.find(el => pressCallbacks.has(el)) || null

  if (!pressCandidate) return

  fsmState = 'PRESS_PENDING'
  state.isPressed.value = true
  pressCallbacks.get(pressCandidate)?.forEach(fn => fn(event))
}

function pointerMove(event) {
  state.x.value = event.clientX
  state.y.value = event.clientY

  if (fsmState !== 'PRESS_PENDING') return

  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return

  swipeAxis = absDx > absDy ? 'horizontal' : 'vertical'

  const originElements = document.elementsFromPoint(start.x, start.y)
  swipeCandidate = originElements.find(el => {
    const cfg = swipeCallbacks.get(el)
    return cfg && (cfg.axis === swipeAxis || cfg.axis === 'both')
  })

  if (!swipeCandidate) return

  // Swipe wins → cancel press
  cancelCallbacks.get(pressCandidate)?.forEach(fn => fn())
  pressCandidate = null

  fsmState = 'SWIPING'
}

function pointerMoveSwipe(event) {
  if (fsmState !== 'SWIPING' || !swipeCandidate) return

  const cfg = swipeCallbacks.get(swipeCandidate)
  if (!cfg) return

  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  const delta = swipeAxis === 'horizontal' ? dx : dy

  swipeAccum += delta

  swipeDir = swipeAxis === 'horizontal'
    ? (delta > 0 ? 'right' : 'left')
    : (delta > 0 ? 'down' : 'up')

  if (!swipeStarted) {
    cfg.handlers?.onSwipeStart?.({ el: swipeCandidate, axis: swipeAxis })
    swipeStarted = true
  }

  cfg.handlers[swipeDir]?.({
    el: swipeCandidate,
    dir: swipeDir,
    delta,
    total: swipeAccum
  })

  start.x = event.clientX
  start.y = event.clientY
}

function pointerUp(event) {
  if (fsmState === 'PRESS_PENDING' && pressCandidate) {
    releaseCallbacks.get(pressCandidate)?.forEach(fn => fn(event))
  }

  if (fsmState === 'SWIPING' && swipeCandidate && swipeDir) {
    const cfg = swipeCallbacks.get(swipeCandidate)
    cfg?.handlers?.onSwipeRelease?.({
      el: swipeCandidate,
      dir: swipeDir,
      total: swipeAccum
    })
  }

  reset()
}

function reset() {
  fsmState = 'IDLE'
  pressCandidate = swipeCandidate = null
  swipeAxis = swipeDir = null
  swipeAccum = 0
  state.isPressed.value = false
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------
// Helper functions
function addCallback(map, el, fn) {
  if (!el || !fn) return
  if (!map.has(el)) map.set(el, new Set())
  map.get(el).add(fn)
}

// function removeCallback(map, el, fn) {
//   if (!el || !map.has(el)) return
//   const set = map.get(el)
//   set.delete(fn)
//   if (!set.size) map.delete(el)
// }

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------
export const inputEngine = {
  state,

  registerPressTarget(el, {
    onPress,
    onRelease,
    onPressCancel,
    onSwipeStart,
    onSwipeRelease,
    onSwipe = {}
  } = {}) {
    // Safely add callbacks (no overwriting)
    addCallback(pressCallbacks, el, onPress)
    addCallback(releaseCallbacks, el, onRelease)
    addCallback(cancelCallbacks, el, onPressCancel)

    // Swipe handlers
    const handlers = { ...onSwipe }
    if (onSwipeStart) handlers.onSwipeStart = onSwipeStart
    if (onSwipeRelease) handlers.onSwipeRelease = onSwipeRelease

    const hasH = handlers.left || handlers.right
    const hasV = handlers.up || handlers.down
    const axis = hasH && hasV ? 'both' : hasH ? 'horizontal' : hasV ? 'vertical' : null

    if (axis) {
      // Only set once per element, don’t overwrite
      if (!swipeCallbacks.has(el)) swipeCallbacks.set(el, { axis, handlers })
    }
  },

  unregisterPressTarget(el) {
    if (!el) return

    // Delete all callback sets safely
    pressCallbacks.delete(el)
    releaseCallbacks.delete(el)
    cancelCallbacks.delete(el)
    swipeCallbacks.delete(el)
  }
}

// Global listeners
window.addEventListener('pointerdown', pointerDown)
window.addEventListener('pointermove', e => {
  if (fsmState === 'SWIPING') pointerMoveSwipe(e)
  else pointerMove(e)
})
window.addEventListener('pointerup', pointerUp)
