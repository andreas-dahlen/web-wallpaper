import { ref } from 'vue'

const SWIPE_THRESHOLD = 40

// --- Reactive pointer state ---
const isPressed = ref(false)          // Tracks if the pointer is currently down
const position = { x: ref(0), y: ref(0) } // Current pointer coordinates
const start = { x: 0, y: 0 }          // Starting coordinates of current interaction

// --- Element tracking ---
const pressTargets = new Map()        // Map<HTMLElement, Array<onPress callbacks>>
const releaseTargets = new Map()      // Map<HTMLElement, Array<onRelease callbacks>>
const swipeTargets = new Set()        // Set<HTMLElement> of elements registered for swipe
const swipeHandlersMap = new WeakMap()// WeakMap<HTMLElement, {left,right,up,down}>

// --- Current interaction ---
let pressOwner = null   // Element that will trigger press/release
let swipeOwner = null   // Element that will trigger swipe
let isSwipe = false     // True once threshold for swipe is crossed

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

  // Find the top-most pressable element under the pointer
  const elUnderPointer = document.elementFromPoint(e.clientX, e.clientY)
  for (let [el] of pressTargets) {
    if (el.contains(elUnderPointer)) {
      pressOwner = el

      // Immediately trigger onPress for visual feedback
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

  // Detect swipe start if threshold crossed
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
    return
  }

  // Call swipe handlers if applicable
  if (isSwipe && swipeOwner && swipeHandlersMap.has(swipeOwner)) {
    const handlers = swipeHandlersMap.get(swipeOwner)
    let direction = null
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    // Determine swipe direction
    if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
      direction = dx > 0 ? 'right' : 'left'
    } else if (absDy > SWIPE_THRESHOLD) {
      direction = dy > 0 ? 'down' : 'up'
    }

    // Trigger swipe callback if it exists
    if (direction && typeof handlers[direction] === 'function') {
      handlers[direction]({ dx, dy })

      // Reset start for incremental swipe tracking
      start.x = e.clientX
      start.y = e.clientY
    }
  }
}

// --- POINTER UP ---
function handlePointerUp(e) {
  // Only trigger onRelease if it was NOT a swipe
  if (!isSwipe && pressOwner) {
    if (releaseTargets.has(pressOwner)) {
      releaseTargets.get(pressOwner).forEach(fn => fn(e))
    }
  }

  // Reset state for next interaction
  isPressed.value = false
  isSwipe = false
  pressOwner = null
  swipeOwner = null
}

// --- PUBLIC API ---
export const inputEngine = {
  // Register an element with optional press, release, and swipe callbacks
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

  // Expose reactive pointer state for use in Vue components
  state: { isPressed, x: position.x, y: position.y },

  // Expose raw handlers for WebView integration
  _handlePointerDown: handlePointerDown,
  _handlePointerMove: handlePointerMove,
  _handlePointerUp: handlePointerUp
}

// --- Global pointer listeners ---
window.addEventListener('pointerdown', handlePointerDown)
window.addEventListener('pointermove', handlePointerMove)
window.addEventListener('pointerup', handlePointerUp)
