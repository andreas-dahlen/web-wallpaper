import { reactive } from 'vue'
import { clampNumber } from '../math/clampMath'

/* -------------------------
   Central swipe state
-------------------------- */
export const carouselState = reactive({
  lanes: {}
})

/* -------------------------
   Lane helpers
-------------------------- */
export function ensureLane(laneId) {
  if (!carouselState.lanes[laneId]) {
    carouselState.lanes[laneId] = {
      index: 0,
      offset: 0,
      committedOffset: 0,
      count: 0,
      pendingDir: null,
      dragging: false,
      size: 0 // width or height of lane
    }
  }
  return carouselState.lanes[laneId]
}

export function setLaneCount(laneId, count) {
  const lane = ensureLane(laneId)
  lane.count = Math.max(0, count)
  lane.index = clampNumber(lane.index, 0, lane.count - 1)
}

export function setLaneIndex(laneId, index) {
  const lane = ensureLane(laneId)
  lane.index = clampNumber(index, 0, lane.count - 1)
  lane.offset = 0
  lane.pendingDir = null
}

export function setLaneSize(laneId, size) {
  ensureLane(laneId).size = size
}

export function setLaneDragging(laneId, dragging) {
  ensureLane(laneId).dragging = dragging
}

export function applyLaneOffset(laneId, offset) {
  ensureLane(laneId).offset = offset
}

/* -------------------------
   Commit lane swipe (animation)
-------------------------- */
export function commitLaneSwipe(laneId, dir) {
  const lane = ensureLane(laneId)
  if (!lane.count || !lane.size) return // fail gracefully

  lane.pendingDir = dir
  lane.dragging = false

  lane.offset =
    dir === 'right' || dir === 'down' ? lane.size :
    dir === 'left' || dir === 'up'   ? -lane.size : 0
}

/* -------------------------
   Lane accessors (read-only)
-------------------------- */
export function getLane(laneId) {
  return carouselState.lanes[laneId] || null
}

export function getLaneBase(laneId) {
  const lane = getLane(laneId)
  if (!lane) return { committedOffset: 0, offset: 0, size: 0 }
  return {
    committedOffset: lane.committedOffset,
    offset: lane.offset,
    size: lane.size
  }
}

export function getLaneOffset(laneId) {
  const lane = getLane(laneId)
  return lane ? lane.offset : 0
}

export function getLaneCommittedOffset(laneId) {
  const lane = getLane(laneId)
  return lane ? lane.committedOffset : 0
}

export function getLaneSize(laneId) {
  const lane = getLane(laneId)
  return lane ? lane.size : 0
}
