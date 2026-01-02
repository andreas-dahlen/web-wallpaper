import { reactive } from 'vue'

export const swipeState = reactive({
  lanes: {}
})

/* -------------------------
   Lane helpers
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
   Swipe commit (animation start)
-------------------------- */

export function commitLaneSwipe(laneId, dir) {
  const lane = ensureLane(laneId)
  if (!lane.count || !lane.size) return

  lane.pendingDir = dir
  lane.dragging = false

  // set offset to full swipe distance (animation will handle transition)
  lane.offset =
    dir === 'right' || dir === 'down' ? lane.size :
    dir === 'left' || dir === 'up'   ? -lane.size : 0
}

/* -------------------------
   Utils
-------------------------- */

function clamp(v, min, max) {
  if (max < min) return min
  return Math.min(max, Math.max(min, v))
}
