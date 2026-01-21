import { reactive } from 'vue'

/**
 * gestureState.js - Shared pointer gesture tracking
 *
 * Responsibilities:
 * - Track global gesture (active, start/end positions, swipeType)
 * - Track per-lane drag positions (renderer owns write access)
 * - Provide snapshots for renderer/reactionSwipe
 */

export const gestureState = reactive({
  // Global gesture tracking
  active: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  swipeType: null,

  // Per-lane/drag tracking
  lanes: {},
  dragPositions: {},   // last committed positions (renderer writes)
  dragBases: {}        // per-gesture snapshot for absolute calculations
})

/* -------------------------
   Core gesture functions
-------------------------- */
export function resetGestureTracking() {
  gestureState.active = false
  gestureState.swipeType = null
}

export function beginGestureTracking(x, y, swipeType) {
  gestureState.active = true
  gestureState.startX = x
  gestureState.startY = y
  gestureState.lastX = x
  gestureState.lastY = y
  gestureState.swipeType = swipeType || null
}

export function attachDragRawDelta(intent) {
  if (!gestureState.active || gestureState.swipeType !== 'drag') return intent

  gestureState.lastX = intent.x
  gestureState.lastY = intent.y

  return {
    ...intent,
    rawDelta: {
      x: intent.x - gestureState.startX,
      y: intent.y - gestureState.startY
    }
  }
}

/* -------------------------
   Drag position helpers
-------------------------- */

/**
 * Renderer-only: commit drag position for lane
 */
export function setDragPosition(lane, pos) {
  gestureState.dragPositions[lane] = { ...pos }
}

/**
 * Read-only getter for components
 */
export function getDragPosition(lane) {
  return gestureState.dragPositions[lane] || { x: 0, y: 0 }
}

/* -------------------------
   Drag base snapshot (per-gesture)
-------------------------- */

/**
 * Take snapshot for current lane at start of gesture
 * Used by renderer/reactionSwipe to compute absolute positions
 */
export function snapshotDragBase(lane) {
  gestureState.dragBases[lane] = getDragPosition(lane)
}

/**
 * Retrieve snapshot for lane
 */
export function getDragBase(lane) {
  return gestureState.dragBases[lane] || null
}

/**
 * Clear snapshot (on commit, revert, reset)
 */
export function clearDragBase(lane) {
  delete gestureState.dragBases[lane]
}