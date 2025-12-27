import { ref } from 'vue'
import { debugDown, debugMove, debugUp } from './debugInput'
import { APP_SETTINGS } from '../config/appSettings'

const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeThreshold

// -----------------------------------------------------------------------------
// Reactive state (for UI binding / debugging)
// -----------------------------------------------------------------------------
export const state = {
  isPressed: ref(false),
  x: ref(0),
  y: ref(0)
}

// -----------------------------------------------------------------------------
// FSM & gesture state
// -----------------------------------------------------------------------------
let fsmState = 'IDLE'        // 'IDLE' | 'PRESS' | 'SWIPE'
let pressElement = null      // element handling press
let swipeElement = null      // element handling swipe
let swipeAxis = null         // 'horizontal' | 'vertical'
let swipeDir = null          // 'left' | 'right' | 'up' | 'down'

const start = { x: 0, y: 0 } // origin of current gesture
let swipeStarted = false
let swipeAccum = 0

// -----------------------------------------------------------------------------
// Callback registries
// -----------------------------------------------------------------------------
const pressCallbacks = new Map()
const releaseCallbacks = new Map()
const cancelCallbacks = new Map()
const swipeCallbacks = new WeakMap()

// -----------------------------------------------------------------------------
// Pointer event handlers
// -----------------------------------------------------------------------------
function pointerDown(event) {
  debugDown(event.clientX, event.clientY)

  start.x = state.x.value = event.clientX
  start.y = state.y.value = event.clientY
  state.isPressed.value = false
  swipeAxis = swipeDir = null
  swipeAccum = 0
  swipeStarted = false

  const elements = document.elementsFromPoint(event.clientX, event.clientY)
  pressElement = elements.find(el => pressCallbacks.has(el))
  if (!pressElement) return

  fsmState = 'PRESS'
  state.isPressed.value = true
  pressCallbacks.get(pressElement)?.forEach(fn => fn(event))
}

function pointerMove(event) {
  debugMove(event.clientX, event.clientY)

  state.x.value = event.clientX
  state.y.value = event.clientY

  const dx = event.clientX - start.x
  const dy = event.clientY - start.y
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  // ---- PRESS → SWIPE detection ----
  if (fsmState === 'PRESS') {
    if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return

    swipeAxis = absDx > absDy ? 'horizontal' : 'vertical'
    const pressSwipeConfig = pressElement ? swipeCallbacks.get(pressElement) : null
    const supportsAxis = pressSwipeConfig && (pressSwipeConfig.axis === swipeAxis || pressSwipeConfig.axis === 'both')

    if (supportsAxis) {
      swipeElement = pressElement
    } else {
      if (pressElement) cancelCallbacks.get(pressElement)?.forEach(fn => fn())
      const elementsAtOrigin = document.elementsFromPoint(start.x, start.y)
      swipeElement = elementsAtOrigin.find(el => {
        const config = swipeCallbacks.get(el)
        return config && (config.axis === swipeAxis || config.axis === 'both')
      })
    }

    fsmState = swipeElement ? 'SWIPE' : 'IDLE'
    state.isPressed.value = !swipeElement
    pressElement = null
    return
  }

  // ---- SWIPE handling ----
  if (fsmState !== 'SWIPE' || !swipeElement) return
  const swipeConfig = swipeCallbacks.get(swipeElement)
  if (!swipeConfig) return

  if (!swipeStarted) {
    swipeConfig.handlers?.onSwipeStart?.({ el: swipeElement, axis: swipeAxis })
    swipeStarted = true
  }

  // compute delta along main axis
  const delta = swipeAxis === 'horizontal' ? dx : dy
  swipeAccum += delta

  // determine direction
  swipeDir = swipeAxis === 'horizontal'
    ? (delta > 0 ? 'right' : 'left')
    : (delta > 0 ? 'down' : 'up')

  // call directional handler if exists
  swipeConfig.handlers[swipeDir]?.({
    el: swipeElement,
    dir: swipeDir,
    delta,
    total: swipeAccum
  })

  // reset origin for smooth continuous swipe
  start.x = event.clientX
  start.y = event.clientY
}

function pointerUp(event) {
  debugUp(event.clientX, event.clientY)

  // PRESS: call release
  if (fsmState === 'PRESS' && pressElement) {
    releaseCallbacks.get(pressElement)?.forEach(fn => fn(event))
  }

  // SWIPE: call onSwipeRelease
  if (fsmState === 'SWIPE' && swipeElement && swipeDir) {
    const swipeConfig = swipeCallbacks.get(swipeElement)
    swipeConfig?.handlers?.onSwipeRelease?.({
      el: swipeElement,
      dir: swipeDir,
      total: swipeAccum
    })
  }

  // reset FSM
  fsmState = 'IDLE'
  pressElement = swipeElement = swipeAxis = swipeDir = null
  swipeAccum = 0
  state.isPressed.value = false
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------
export const inputEngine = {
  state,

  /**
   * Register an element for touch/swipe events
   * onPress(el)
   * onRelease(el)
   * onPressCancel(el)
   * onSwipe{left,right,up,down}({el, dir, delta, total})
   * onSwipeStart({el, axis})
   * onSwipeRelease({el, dir, total})
   */
  registerPressTarget(el, {
    onPress, // el
    onRelease, // el
    onPressCancel, // el
    onSwipeStart,        // { el, axis } optional
    onSwipeRelease,       // { el, dir, total } optional
    onSwipe = {}        // { left, right, up, down }
  } = {}) {
    if (onPress) pressCallbacks.set(el, [...(pressCallbacks.get(el) || []), onPress])
    if (onRelease) releaseCallbacks.set(el, [...(releaseCallbacks.get(el) || []), onRelease])
    if (onPressCancel) cancelCallbacks.set(el, [...(cancelCallbacks.get(el) || []), onPressCancel])

    if (!onSwipe && !onSwipeRelease && !onSwipeStart) return

    const handlers = { ...onSwipe }
    if (onSwipeStart) handlers.onSwipeStart = onSwipeStart
    if (onSwipeRelease) handlers.onSwipeRelease = onSwipeRelease

    const hasHorizontal = handlers.left || handlers.right
    const hasVertical = handlers.up || handlers.down
    const axis = hasHorizontal && hasVertical
      ? 'both'
      : hasHorizontal
        ? 'horizontal'
        : hasVertical
          ? 'vertical'
          : null
    if (!axis && !onSwipeStart && !onSwipeRelease) return

    swipeCallbacks.set(el, { axis, handlers })
  }
}

// -----------------------------------------------------------------------------
// Attach global listeners
// -----------------------------------------------------------------------------
window.addEventListener('pointerdown', pointerDown)
window.addEventListener('pointermove', pointerMove)
window.addEventListener('pointerup', pointerUp)
