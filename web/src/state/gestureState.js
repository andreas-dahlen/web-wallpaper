import { reactive } from 'vue'

/**
 * gestureState.js - Shared pointer gesture tracking
 *
 * Responsibilities:
 * - Track global gesture (active, start/end positions, swipeType)
 * - Track per-lane drag positions (renderer owns write access)
 * - Provide snapshots for renderer/reactionSwipe
 * - Track element-local absolute positions via WeakMap to avoid jumps
 */

/* -------------------------
   Global reactive state
-------------------------- */
export const gestureState = reactive({
  active: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  swipeType: null,

  // Per-lane/drag tracking
  lanes: {},
  dragPositions: {},   // last committed positions (renderer writes)

  // Per-gesture snapshots
  swipeBases: {}       // numeric swipes (slider/carousel)
})

/* -------------------------
   WeakMap to track element positions
-------------------------- */
const elementPositions = new WeakMap()

export function setElementPosition(el, pos) {
  if (!el || !pos) return
  elementPositions.set(el, { ...pos })
}

export function getElementPosition(el) {
  if (!el) return { x: 0, y: 0 }
  return elementPositions.get(el) || { x: 0, y: 0 }
}

/* -------------------------
   Core gesture functions
-------------------------- */
export function resetGestureTracking() {
  gestureState.active = false
  gestureState.swipeType = null
  gestureState.swipeBases = {}
}

export function beginGestureTracking(x, y, swipeType) {
  gestureState.active = true
  gestureState.startX = x
  gestureState.startY = y
  gestureState.lastX = x
  gestureState.lastY = y
  gestureState.swipeType = swipeType || null
}

/* -------------------------
   Swipe base snapshot (numeric swipes)
-------------------------- */
export function snapshotSwipeBase(lane, snapshot) {
  if (!lane || !snapshot) return
  gestureState.swipeBases[lane] = { ...snapshot }
}

export function getSwipeBase(lane) {
  return gestureState.swipeBases[lane] || null
}

export function clearSwipeBase(lane) {
  if (!lane) return
  delete gestureState.swipeBases[lane]
}

/* -------------------------
   Drag delta helpers
-------------------------- */
export function attachDragRawDelta(intent) {
  if (!gestureState.active || gestureState.swipeType !== 'drag') return intent

  // Always try element first, then fallback to lane
  const base = intent.element
    ? getElementPosition(intent.element)
    : intent.laneId
      ? gestureState.dragPositions[intent.laneId] || { x: 0, y: 0 }
      : { x: 0, y: 0 }

  const rawDelta = {
    x: intent.x - base.x,
    y: intent.y - base.y
  }

  gestureState.lastX = intent.x
  gestureState.lastY = intent.y

  return {
    ...intent,
    rawDelta,
    delta: rawDelta
  }
}

/* -------------------------
   Drag position helpers
-------------------------- */
export function setDragPosition(lane, pos, element) {
  if (lane) gestureState.dragPositions[lane] = { ...pos }
  if (element) setElementPosition(element, pos)
}

export function getDragPosition(lane) {
  return gestureState.dragPositions[lane] || { x: 0, y: 0 }
}

/* -------------------------
   Drag base snapshot (per-gesture)
-------------------------- */
export function snapshotDragBase(lane, element) {
  if (!lane && !element) return

  const pos = element
    ? getElementPosition(element)
    : lane
      ? gestureState.dragPositions[lane] || { x: 0, y: 0 }
      : { x: 0, y: 0 }

  if (lane) gestureState.dragPositions[lane] = { ...pos }
  if (element) setElementPosition(element, pos)
}

export function getDragBase(elOrLane) {
  if (!elOrLane) return { x: 0, y: 0 }

  // If it is a DOM element, use WeakMap; else fallback to lane
  return elOrLane?.nodeType === 1 // checks for HTMLElement
    ? getElementPosition(elOrLane)
    : gestureState.dragPositions[elOrLane] || { x: 0, y: 0 }
}

export function clearDragBase(laneOrElement) {
  if (!laneOrElement) return

  if (laneOrElement?.nodeType === 1) {
    elementPositions.delete(laneOrElement)
  } else {
    delete gestureState.dragPositions[laneOrElement]
  }
}
