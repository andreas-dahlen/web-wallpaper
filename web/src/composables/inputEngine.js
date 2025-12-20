import { ref } from 'vue'

const SWIPE_THRESHOLD = 40

// --- Reactive pointer state ---
const isPressed = ref(false)
const position = { x: ref(0), y: ref(0) }
const start = { x: 0, y: 0 }

// --- Element tracking ---
const pressTargets = new Map()        // el -> [onPress callbacks]
const releaseTargets = new Map()      // el -> [onRelease callbacks]
const swipeTargets = new Set()        // elements registered for swipe
const swipeHandlersMap = new WeakMap() // el -> { left, right, up, down }

// --- Current interaction ---
let pressOwner = null   // element that will trigger press/release
let swipeOwner = null   // element that will trigger swipe
let isSwipe = false

// --- POINTER DOWN ---
function handlePointerDown(e) {
  isPressed.value = true
  start.x = e.clientX
  start.y = e.clientY
  position.x.value = e.clientX
  position.y.value = e.clientY
  isSwipe = false
  pressOwner = null
  swipeOwner = null

  // Find top-most pressable element under pointer
  for (let [el] of pressTargets) {
    if (el.contains(e.target)) {
      pressOwner = el

      // Immediately call onPress
      if (pressTargets.has(pressOwner)) {
        pressTargets.get(pressOwner).forEach(fn => fn(e))
      }

      break
    }
  }
}

// --- POINTER MOVE ---
function handlePointerMove(e) {
  if (!isPressed.value) return

  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  position.x.value = e.clientX
  position.y.value = e.clientY

  // Detect start of swipe if threshold crossed
  if (!isSwipe && (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD)) {
    isSwipe = true

    // Find top-most swipeable element under pointer
    const elUnderPointer = document.elementFromPoint(e.clientX, e.clientY)
    for (let el of swipeTargets) {
      if (el.contains(elUnderPointer)) {
        swipeOwner = el
        break
      }
    }

    // Cancel pressOwner once swipe starts
    pressOwner = null

    // Reset start for incremental swipe tracking
    start.x = e.clientX
    start.y = e.clientY
  }

  // Call swipe handlers if applicable
  if (isSwipe && swipeOwner && swipeHandlersMap.has(swipeOwner)) {
    const handlers = swipeHandlersMap.get(swipeOwner)
    let direction = null
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
      direction = dx > 0 ? 'right' : 'left'
    } else if (absDy > SWIPE_THRESHOLD) {
      direction = dy > 0 ? 'down' : 'up'
    }

    if (direction && typeof handlers[direction] === 'function') {
      handlers[direction]({ dx, dy })
      start.x = e.clientX
      start.y = e.clientY
    }
  }
}

// --- POINTER UP ---
function handlePointerUp(e) {
  // Only trigger release if it was NOT a swipe
  if (!isSwipe && pressOwner) {
    if (releaseTargets.has(pressOwner)) {
      releaseTargets.get(pressOwner).forEach(fn => fn(e))
    }
  }

  // Reset state
  isPressed.value = false
  isSwipe = false
  pressOwner = null
  swipeOwner = null
}

// --- PUBLIC API ---
export const inputEngine = {
  // Register element with optional press/release/swipe callbacks
  registerPressTarget(el, { onPress, onRelease, onSwipe } = {}) {
    if (onPress) {
      if (!pressTargets.has(el)) pressTargets.set(el, [])
      pressTargets.get(el).push(onPress)
    }
    if (onRelease) {
      if (!releaseTargets.has(el)) releaseTargets.set(el, [])
      releaseTargets.get(el).push(onRelease)
    }
    if (onSwipe) {
      swipeTargets.add(el)
      swipeHandlersMap.set(el, onSwipe)
    }
  },

  // Reactive pointer state for use in components
  state: { isPressed, x: position.x, y: position.y }
}

// --- Global listeners ---
window.addEventListener('pointerdown', handlePointerDown)
window.addEventListener('pointermove', handlePointerMove)
window.addEventListener('pointerup', handlePointerUp)
