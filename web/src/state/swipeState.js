import { APP_SETTINGS } from '../config/appSettings'
import { reactive } from 'vue'

/* -------------------------
   Central swipe state
-------------------------- */
export const swipeState = reactive({
  lanes: {}
})

/* -------------------------
   Swipe thresholds
-------------------------- */
export function shouldStartSwipeLane(laneId, delta) {
  const lane = swipeState.lanes[laneId]
  if (!lane) return false
  return shouldStartSwipeBySize(lane.size, delta)
}

export function shouldCommitSwipeLane(laneId, delta) {
  const lane = swipeState.lanes[laneId]
  if (!lane) return false

  return shouldCommitSwipeBySize(lane.size, delta)
}

/* -------------------------
   Lane helpers (unchanged)
-------------------------- */
export function ensureLane(laneId) {
  if (!swipeState.lanes[laneId]) {
    swipeState.lanes[laneId] = {
      index: 0,
      offset: 0,
      count: 0,
      pendingDir: null,
      dragging: false,
      size: 0 // width or height of lane
    }
  }
  return swipeState.lanes[laneId]
}

export function setLaneCount(laneId, count) {
  const lane = ensureLane(laneId)
  lane.count = Math.max(0, count)
  lane.index = clamp(lane.index, 0, lane.count - 1)
}

export function setLaneIndex(laneId, index) {
  const lane = ensureLane(laneId)
  lane.index = clamp(index, 0, lane.count - 1)
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
  if (!lane.count || !lane.size) return

  lane.pendingDir = dir
  lane.dragging = false

  lane.offset =
    dir === 'right' || dir === 'down' ? lane.size :
    dir === 'left' || dir === 'up'   ? -lane.size : 0
}

export function shouldStartSwipeBySize(size, delta) {
  if (!size) return false

  return Math.abs(delta) >=
    size * APP_SETTINGS.swipeThresholdRatio
}

export function shouldCommitSwipeBySize(size, delta) {
  if (!size) return false

  return Math.abs(delta) >=
    size * APP_SETTINGS.swipeCommitRatio
}

/* -------------------------
   Utility
-------------------------- */
function clamp(v, min, max) {
  if (max < min) return min
  return Math.min(Math.max(v, min), max)
}