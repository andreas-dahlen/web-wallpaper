import { reactive } from 'vue'

/**
 * gestureState.js - Unified gesture tracking
 *
 * Simplifications:
 * - No WeakMaps or element snapshots; use a simple keyed state for last-known positions.
 * - Drag math is delta-from-gesture-start applied on top of last-known position.
 * - Sliders/carousels keep existing 1D delta behavior; drags use both axes.
 * - Hooks are present for future locking/snapping without changing callers.
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

  // Per-lane or per-element persisted drag positions (last-known absolute)
  dragPositions: {},

  // Per-gesture bases for numeric swipes (slider/carousel)
  swipeBases: {},

  // Optional locking hooks for future features
  locks: {}
})

/* -------------------------
   Internal helpers
-------------------------- */
const ZERO_POS = { x: 0, y: 0 }

function getLastKnown(key) {
  return gestureState.dragPositions[key] || ZERO_POS
}

function setLastKnown(key, pos) {
  if (!key || !pos) return
  gestureState.dragPositions[key] = { x: pos.x ?? 0, y: pos.y ?? 0 }
}

/* -------------------------
   Core gesture lifecycle
-------------------------- */
export function resetGestureTracking() {
  gestureState.active = false
  gestureState.swipeType = null
  gestureState.swipeBases = {}
}

export function beginGestureTracking({ x = 0, y = 0, swipeType }) {
  gestureState.active = true
  gestureState.startX = x
  gestureState.startY = y
  gestureState.lastX = x
  gestureState.lastY = y
  gestureState.swipeType = swipeType || null
}

export function getGestureStart() {
  return { x: gestureState.startX, y: gestureState.startY }
}

/* -------------------------
   Numeric swipe snapshots (slider/carousel stay 1D)
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
   Drag delta helpers (2D)
-------------------------- */
/**
 * Attaches a 2D delta based on gesture start and last-known absolute position.
 * Delta is simple: (current - start) + lastKnown.
 */
// Drag bases are persisted by renderer; computations live in math helpers.

/* -------------------------
   Drag position persistence
-------------------------- */
// Renderer should call this on commit/release to persist absolute position.
export function setDragPosition(keyOrLane, pos) {
  const key = keyOrLane || 'default'
  setLastKnown(key, pos || ZERO_POS)
}

export function getDragPosition(keyOrLane) {
  const key = keyOrLane || 'default'
  return getLastKnown(key)
}

/* -------------------------
   Optional locking/snapping hooks (no-ops for now)
-------------------------- */
// export function lockDrag(key) {
//   if (!key) return
//   gestureState.locks[key] = true
// }

// export function unlockDrag(key) {
//   if (!key) return
//   delete gestureState.locks[key]
// }

// export function isDragLocked(key) {
//   return !!gestureState.locks[key]
// }
/* -------------------------
   Drag base cleanup (compat / no-op)
-------------------------- */
// In the simplified model, drag bases are implicit (lastKnown).
// This exists to satisfy renderer cleanup calls.
export function clearDragBase(key) {
  // no-op by design
  key
}