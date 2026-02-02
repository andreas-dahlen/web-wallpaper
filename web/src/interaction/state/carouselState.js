import { reactive } from 'vue'
import { clampNumber } from '../math/clampMath'

/* -------------------------------------------------
   Central carousel state
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
      committedOffset: 0,

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
   Coordinator-facing helpers
   (NO math, NO policy)
------------------------------------------------- */

export function enableDragging(laneId) {
  ensureLane(laneId).dragging = true
}

export function disableDragging(laneId) {
  ensureLane(laneId).dragging = false
}

export function clearPendingDir(laneId) {
  ensureLane(laneId).pendingDir = null
}

export function applyLaneOffset(laneId, offset) {
  console.log(offset)
  ensureLane(laneId).offset = offset
}

export function commitLane(laneId, offset) {
  const lane = ensureLane(laneId)
  const value = offset ?? 0

  lane.committedOffset = value
  lane.offset = value
  lane.dragging = false
  lane.pendingDir = null
}

/* -------------------------------------------------
   Optional animation intent (renderer-driven)
------------------------------------------------- */

export function commitLaneSwipe(laneId, dir) {
  const lane = ensureLane(laneId)
  if (!lane.size || !lane.count) return

  lane.pendingDir = dir
  lane.dragging = false

  lane.offset =
    dir === 'right' || dir === 'down'
      ? lane.size
      : dir === 'left' || dir === 'up'
        ? -lane.size
        : 0
}

/* -------------------------------------------------
   Read-only accessors
------------------------------------------------- */

export function getLaneOffset(laneId) {
  return getLane(laneId)?.offset ?? 0
}

export function getLaneCommittedOffset(laneId) {
  return getLane(laneId)?.committedOffset ?? 0
}

export function getLaneSize(laneId) {
  return getLane(laneId)?.size ?? 0
}

export function getLaneBase(laneId) {
  const lane = getLane(laneId)
  if (!lane) {
    return { committedOffset: 0, offset: 0, size: 0 }
  }

  return {
    committedOffset: lane.committedOffset,
    offset: lane.offset,
    size: lane.size
  }
}