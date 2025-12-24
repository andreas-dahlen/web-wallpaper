// input/inputEngine.js
import { ref } from 'vue'
import { debugDown, debugMove, debugUp } from './debugInput'
import { APP_SETTINGS } from '../config/appSettings'

const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeThreshold

// --- reactive state (screen pixels) ---
export const state = {
  isPressed: ref(false),
  x: ref(0),
  y: ref(0)
}

// --- FSM ---
let fsmState = 'IDLE' // IDLE | PRESS | SWIPE

let pressOwner = null
let swipeOwner = null

const start = { x: 0, y: 0 }

// --- registries ---
const pressTargets = new Map()
const releaseTargets = new Map()
const cancelTargets = new Map()
const swipeTargets = new Set()
const swipeHandlersMap = new WeakMap()

// --- DOM helpers ---
function findNearest(el, registry) {
  let node = el
  while (node) {
    if (registry.has(node)) return node
    node = node.parentElement
  }
  return null
}

// --- pointer handlers ---
function pointerDown(e) {
  debugDown(e.clientX, e.clientY)

  state.x.value = start.x = e.clientX
  state.y.value = start.y = e.clientY
  state.isPressed.value = false

  const el = document.elementFromPoint(e.clientX, e.clientY)
  if (!el) return

  const target = findNearest(el, pressTargets)
  if (!target) return

  pressOwner = target
  state.isPressed.value = true
  fsmState = 'PRESS'

  pressTargets.get(target)?.forEach(fn => fn(e))
}

function pointerMove(e) {
  debugMove(e.clientX, e.clientY)

  state.x.value = e.clientX
  state.y.value = e.clientY

  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  // --- PRESS → SWIPE ---
  if (fsmState === 'PRESS') {
    if (Math.max(absDx, absDy) > SWIPE_THRESHOLD) {
      const pressHasSwipe = pressOwner && swipeHandlersMap.has(pressOwner)

      if (pressHasSwipe) {
        // same element supports swipe → keep it as swipeOwner
        swipeOwner = pressOwner
      } else {
        //Cancel the press
        if (pressOwner) {
          cancelTargets.get(pressOwner)?.forEach(fn => fn(pressOwner))
        }
        //trying to find swipe target underneath
        const el = document.elementFromPoint(e.clientX, e.clientY)
        swipeOwner = el ? findNearest(el, swipeTargets) : null
      }

      pressOwner = null
      state.isPressed.value = false
      fsmState = swipeOwner ? 'SWIPE' : 'IDLE'

      start.x = e.clientX
      start.y = e.clientY
    }
    return
  }

   // --- SWIPE logic ---
  if (fsmState !== 'SWIPE' || !swipeOwner) return

  const handlers = swipeHandlersMap.get(swipeOwner)
  if (!handlers) return

  let dir = null

  if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
    dir = dx > 0 ? 'right' : 'left'
  } else if (absDy > SWIPE_THRESHOLD) {
    dir = dy > 0 ? 'down' : 'up'
  }

  if (dir && handlers[dir]) {
    handlers[dir]({ dx, dy })
    start.x = e.clientX
    start.y = e.clientY
  }
}

function pointerUp(e) {
  debugUp(e.clientX, e.clientY)

  // Fire release if still in PRESS
  if (fsmState === 'PRESS' && pressOwner) {
    releaseTargets.get(pressOwner)?.forEach(fn => fn(e))
  }

  // Fire swipe end if in SWIPE
  if (fsmState === 'SWIPE' && swipeOwner) {
    const handlers = swipeHandlersMap.get(swipeOwner)
    if (handlers?.onSwipeEnd) {
      handlers.onSwipeEnd(swipeOwner)
    }
  }


  // --- full reset ---
  fsmState = 'IDLE'
  pressOwner = null
  swipeOwner = null
  state.isPressed.value = false
}

// --- public API ---
export const inputEngine = {
  registerPressTarget(el, { onPress, onRelease, onPressCancel, onSwipe } = {}) {
    if (onPress) {
      pressTargets.set(el, [...(pressTargets.get(el) || []), onPress])
    }
    if (onRelease) {
      releaseTargets.set(el, [...(releaseTargets.get(el) || []), onRelease])
    }
    if (onPressCancel) {
      cancelTargets.set(el, [...(cancelTargets.get(el) || []), onPressCancel])
    }
    if (onSwipe) {
      swipeTargets.add(el)
      swipeHandlersMap.set(el, onSwipe)
    }
  },

  state
}

// --- browser input ---
window.addEventListener('pointerdown', pointerDown)
window.addEventListener('pointermove', pointerMove)
window.addEventListener('pointerup', pointerUp)
