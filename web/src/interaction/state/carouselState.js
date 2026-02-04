import { reactive } from 'vue'
import { clampNumber } from '../math/clampMath'
import { getNextIndex } from '../reaction/policy/carouselPolicy'

/* -------------------------------------------------
   Central carousel state
   
   This is a passive reactive store. All mutations
   should flow through dispatcher actions.
------------------------------------------------- */

export const carouselState = reactive({
  lanes: {}
})

/* -------------------------------------------------
   Lane creation / access
------------------------------------------------- */

export function ensureLane(laneId) {
  if (!carouselState.lanes[laneId]) {
    carouselState.lanes[laneId] = {
      index: 0,
      count: 0,
      offset: 0,
      size: 0,
      dragging: false,
      pendingDir: null
    }
  }
  return carouselState.lanes[laneId]
}

export function getLane(laneId) {
  return carouselState.lanes[laneId] ?? null
}

/* -------------------------------------------------
   Configuration (called by layout / renderer)
------------------------------------------------- */

export function setLaneCount(laneId, count) {
  const lane = ensureLane(laneId)
  lane.count = Math.max(0, count)
  lane.index = clampNumber(lane.index, 0, lane.count - 1)
}

export function setLaneSize(laneId, size) {
  ensureLane(laneId).size = size
}

export function setLaneIndex(laneId, index) {
  const lane = ensureLane(laneId)
  lane.index = clampNumber(index, 0, lane.count - 1)
  lane.offset = 0
  lane.pendingDir = null
}

/* -------------------------------------------------
   Dispatcher Actions (single choke point for mutations)
   
   These are the only functions that should mutate
   carousel state during gesture handling.
------------------------------------------------- */

/**
 * Start dragging - called by dispatcher on carousel:dragStart
 */
export function startDrag(laneId) {
  const lane = ensureLane(laneId)
  lane.dragging = true
  lane.pendingDir = null
}

/**
 * Apply offset during drag - called by dispatcher on carousel:offset
 */
export function applyOffset(laneId, offset) {
  ensureLane(laneId).offset = offset
}

/**
 * Commit swipe animation - called by dispatcher on carousel:commit
 */
export function commitSwipe(laneId, direction, offset) {
  const lane = ensureLane(laneId)
  lane.pendingDir = direction
  lane.offset = offset
  lane.dragging = false
}

/**
 * Revert to original position - called by dispatcher on carousel:revert
 */
export function revertSwipe(laneId) {
  const lane = ensureLane(laneId)
  lane.offset = 0
  lane.dragging = false
  lane.pendingDir = null
}

/**
 * Finalize transition after CSS animation completes.
 * Called by renderer when transitionend fires.
 */
export function finalizeLaneTransition(laneId) {
  const lane = getLane(laneId)
  if (!lane || !lane.pendingDir) return false

  lane.index = getNextIndex(lane.index, lane.pendingDir, lane.count)
  lane.offset = 0
  lane.pendingDir = null
  return true
}

/* -------------------------------------------------
   Read-only accessors
------------------------------------------------- */

export function getLaneOffset(laneId) {
  return getLane(laneId)?.offset ?? 0
}

export function getLaneSize(laneId) {
  return getLane(laneId)?.size ?? 0
}

