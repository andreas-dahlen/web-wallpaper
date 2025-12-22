// input/inputEngine.js
import { ref } from 'vue'
import { debugDown, debugMove, debugUp } from './debugInput'

const SWIPE_THRESHOLD = 40

// --- reactive state (SCREEN PIXELS) ---
const isPressed = ref(false)
const x = ref(0)
const y = ref(0)

// --- internal tracking ---
const start = { x: 0, y: 0 }
let isSwipe = false
let pressOwner = null
let swipeOwner = null

const pressTargets = new Map()
const releaseTargets = new Map()
const swipeTargets = new Set()
const swipeHandlersMap = new WeakMap()

// --- handlers ---
function pointerDown(e) {
  isPressed.value = true
  x.value = start.x = e.clientX
  y.value = start.y = e.clientY
  isSwipe = false
  pressOwner = swipeOwner = null

  // debug visual + logs
  debugDown(e.clientX, e.clientY)

  // find top-most pressable element
  const el = document.elementFromPoint(e.clientX, e.clientY)
  for (const [target] of pressTargets) {
    if (target.contains(el)) {
      pressOwner = target
      pressTargets.get(target).forEach(fn => fn(e))
      break
    }
  }
}

function pointerMove(e) {
  if (!isPressed.value) return

  const dx = e.clientX - start.x
  const dy = e.clientY - start.y

  x.value = e.clientX
  y.value = e.clientY

  debugMove(e.clientX, e.clientY)

  // detect swipe
  if (!isSwipe && (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD)) {
    isSwipe = true
    pressOwner = null

    const el = document.elementFromPoint(e.clientX, e.clientY)
    for (const target of swipeTargets) {
      if (target.contains(el)) {
        swipeOwner = target
        break
      }
    }

    start.x = e.clientX
    start.y = e.clientY
    return
  }

  // incremental swipe tracking
  if (isSwipe && swipeOwner && swipeHandlersMap.has(swipeOwner)) {
    const handlers = swipeHandlersMap.get(swipeOwner)
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

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
}

function pointerUp(e) {
  debugUp(e.clientX, e.clientY)

  if (!isSwipe && pressOwner && releaseTargets.has(pressOwner)) {
    releaseTargets.get(pressOwner).forEach(fn => fn(e))
  }

  isPressed.value = false
  isSwipe = false
  pressOwner = swipeOwner = null
}

// --- public API ---
export const inputEngine = {
  registerPressTarget(el, { onPress, onRelease, onSwipe } = {}) {
    if (onPress) pressTargets.set(el, [...(pressTargets.get(el) || []), onPress])
    if (onRelease) releaseTargets.set(el, [...(releaseTargets.get(el) || []), onRelease])
    if (onSwipe) {
      swipeTargets.add(el)
      swipeHandlersMap.set(el, onSwipe)
    }
  },

  state: { isPressed, x, y },

  _down: pointerDown,
  _move: pointerMove,
  _up: pointerUp
}

// --- browser input ---
window.addEventListener('pointerdown', pointerDown)
window.addEventListener('pointermove', pointerMove)
window.addEventListener('pointerup', pointerUp)
