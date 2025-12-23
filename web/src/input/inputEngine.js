// input/inputEngine.js
import { ref } from 'vue'
import { debugDown, debugMove, debugUp } from './debugInput'
import { APP_SETTINGS } from '../config/appSettings'

const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeThreshold

// --- reactive state (SCREEN PIXELS) ---
export const state = {
  isPressed: ref(false),
  x: ref(0),
  y: ref(0)
}

// --- internal tracking ---
const start = { x: 0, y: 0 }
let isSwipe = false
let pressOwner = null
let swipeOwner = null

const pressTargets = new Map()
const releaseTargets = new Map()
const swipeTargets = new Set()
const swipeHandlersMap = new WeakMap()

function findNearestPressTarget(el) {
  let node = el
  while (node) {
    if (pressTargets.has(node)) return node
    node = node.parentElement
  }
  return null
}

function findNearestSwipeTarget(el) {
  let node = el
  while (node) {
    if (swipeTargets.has(node)) return node
    node = node.parentElement
  }
  return null
}

// --- handlers ---

function pointerDown(e) {
  state.isPressed.value = true
  state.x.value = start.x = e.clientX
  state.y.value = start.y = e.clientY
  isSwipe = false
  pressOwner = swipeOwner = null

  // debug visual + logs
  debugDown(e.clientX, e.clientY)

  const el = document.elementFromPoint(e.clientX, e.clientY)
  if (!el) return

  // DOM-accurate press priority
  const target = findNearestPressTarget(el)
  if (target) {
    pressOwner = target
    pressTargets.get(target).forEach(fn => fn(e))
  }
}

function pointerMove(e) {
  if (!state.isPressed.value) return

  const dx = e.clientX - start.x
  const dy = e.clientY - start.y

  state.x.value = e.clientX
  state.y.value = e.clientY

  debugMove(e.clientX, e.clientY)

  // detect swipe
  if (!isSwipe && (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD)) {
    isSwipe = true
    pressOwner = null // 🔑 button loses ownership once swipe starts
    //here i could remember old pressOwner incase i want to change back to press if i move my pointer back..? :)

    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el) return

    swipeOwner = findNearestSwipeTarget(el)

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

  // Only release if it was a press (not a swipe)
  if (!isSwipe && pressOwner && releaseTargets.has(pressOwner)) {
    releaseTargets.get(pressOwner).forEach(fn => fn(e))
  }

  state.isPressed.value = false
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

  state,

  _down: pointerDown,
  _move: pointerMove,
  _up: pointerUp
}

// --- browser input ---
window.addEventListener('pointerdown', pointerDown)
window.addEventListener('pointermove', pointerMove)
window.addEventListener('pointerup', pointerUp)
