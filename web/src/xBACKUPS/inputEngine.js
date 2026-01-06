// import { ref } from 'vue'
// import { debugDown, debugMove, debugUp } from './debugInput'
// import { APP_SETTINGS } from '../config/appSettings'

// const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeThreshold

// -----------------------------------------------------------------------------
// Reactive public state (screen pixels)
// -----------------------------------------------------------------------------
// export const state = {
//   isPressed: ref(false),
//   x: ref(0),
//   y: ref(0)
// }

// -----------------------------------------------------------------------------
// FSM: Finite State Machine
// -----------------------------------------------------------------------------
// let fsmState = 'IDLE' // IDLE | PRESS | SWIPE

// let pressOwner = null     // element handling press
// let swipeOwner = null     // element handling swipe

// let swipeAxis = null      // 'horizontal' | 'vertical'
// let swipeDir = null       // 'left' | 'right' | 'up' | 'down'

// const start = { x: 0, y: 0 }

// -----------------------------------------------------------------------------
// Registries
// -----------------------------------------------------------------------------
// const pressTargets = new Map()
// const releaseTargets = new Map()
// const cancelTargets = new Map()
// const swipeHandlersMap = new WeakMap()

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
// function findNearestSwipeOwner(el, axis) {
//   let node = el
//   while (node) {
//     const cfg = swipeHandlersMap.get(node)
//     if (cfg && (cfg.axis === axis || cfg.axis === 'both')) return node
//     node = node.parentElement
//   }
//   return null
// }

// -----------------------------------------------------------------------------
// Pointer Handlers
// -----------------------------------------------------------------------------
// function pointerDown(e) {
//   debugDown(e.clientX, e.clientY)

//   start.x = state.x.value = e.clientX
//   start.y = state.y.value = e.clientY
//   state.isPressed.value = false
//   swipeAxis = swipeDir = null

//   // --- Pick topmost press target under pointer ---
//   const elements = document.elementsFromPoint(e.clientX, e.clientY)
//   pressOwner = elements.find(el => pressTargets.has(el))
//   if (!pressOwner) return

//   fsmState = 'PRESS'
//   state.isPressed.value = true

//   pressTargets.get(pressOwner)?.forEach(fn => fn(e))
// }

// function pointerMove(e) {
//   debugMove(e.clientX, e.clientY)

//   state.x.value = e.clientX
//   state.y.value = e.clientY

//   const dx = e.clientX - start.x
//   const dy = e.clientY - start.y
//   const absDx = Math.abs(dx)
//   const absDy = Math.abs(dy)

  // ---------------------------------------------------------------------------
  // PRESS → SWIPE (intent detection)
  // ---------------------------------------------------------------------------
  // if (fsmState === 'PRESS') {
  //   if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return

  //   swipeAxis = absDx > absDy ? 'horizontal' : 'vertical'

  //   const pressSwipe = pressOwner ? swipeHandlersMap.get(pressOwner) : null
  //   const pressSupportsAxis = pressSwipe && (pressSwipe.axis === swipeAxis || pressSwipe.axis === 'both')

  //   if (pressSupportsAxis) {
  //     swipeOwner = pressOwner
  //   } else {
  //     if (pressOwner) cancelTargets.get(pressOwner)?.forEach(fn => fn())

  //     const elements = document.elementsFromPoint(start.x, start.y)

  //     swipeOwner = elements.find(el => {
  //       const cfg = swipeHandlersMap.get(el)
  //       return cfg && (cfg.axis === swipeAxis || cfg.axis === 'both')
  //     })
  //   }

  //   fsmState = swipeOwner ? 'SWIPE' : 'IDLE'
  //   state.isPressed.value = !swipeOwner
  //   pressOwner = null
  //   return
  // }

  // ---------------------------------------------------------------------------
  // SWIPE handling
  // ---------------------------------------------------------------------------
//   if (fsmState !== 'SWIPE' || !swipeOwner) return

//   const cfg = swipeHandlersMap.get(swipeOwner)
//   if (!cfg) return

//   const deltaX = e.clientX - start.x
//   const deltaY = e.clientY - start.y

//   if (swipeAxis === 'horizontal' && Math.abs(deltaX) > 0) swipeDir = deltaX > 0 ? 'right' : 'left'
//   if (swipeAxis === 'vertical' && Math.abs(deltaY) > 0) swipeDir = deltaY > 0 ? 'down' : 'up'

//   if (swipeDir && cfg.handlers[swipeDir]) {
//     cfg.handlers[swipeDir]({ dx: deltaX, dy: deltaY })
//     // reset origin for smooth continuous swipe
//     start.x = e.clientX
//     start.y = e.clientY
//   }
// }

// function pointerUp(e) {
//   debugUp(e.clientX, e.clientY)

//   if (fsmState === 'PRESS' && pressOwner) {
//     releaseTargets.get(pressOwner)?.forEach(fn => fn(e))
//   }

//   if (fsmState === 'SWIPE' && swipeOwner) {
//     const cfg = swipeHandlersMap.get(swipeOwner)
//     cfg?.handlers?.onSwipeEnd?.({ el: swipeOwner, axis: swipeAxis, dir: swipeDir })
//   }

//   fsmState = 'IDLE'
//   pressOwner = swipeOwner = swipeAxis = swipeDir = null
//   state.isPressed.value = false
// }

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------
// export const inputEngine = {
//   registerPressTarget(el, { onPress, onRelease, onPressCancel, onSwipe } = {}) {
//     if (onPress) pressTargets.set(el, [...(pressTargets.get(el) || []), onPress])
//     if (onRelease) releaseTargets.set(el, [...(releaseTargets.get(el) || []), onRelease])
//     if (onPressCancel) cancelTargets.set(el, [...(cancelTargets.get(el) || []), onPressCancel])

//     if (!onSwipe) return

//     if (onSwipe.handlers && onSwipe.axis) {
//       swipeHandlersMap.set(el, onSwipe)
//       return
//     }

//     const handlers = typeof onSwipe === 'function'
//       ? { left: onSwipe, right: onSwipe, up: onSwipe, down: onSwipe }
//       : onSwipe

//     const hasH = handlers.left || handlers.right
//     const hasV = handlers.up || handlers.down
//     const axis = hasH && hasV ? 'both' : hasH ? 'horizontal' : hasV ? 'vertical' : null
//     if (!axis) return

//     swipeHandlersMap.set(el, { axis, handlers })
//   },
//   state
// }

// -----------------------------------------------------------------------------
// Browser listeners
// -----------------------------------------------------------------------------
// window.addEventListener('pointerdown', pointerDown)
// window.addEventListener('pointermove', pointerMove)
// window.addEventListener('pointerup', pointerUp)
