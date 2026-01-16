import { APP_SETTINGS } from '../config/appSettings'
import { reactive } from 'vue'

/* -------------------------
   Central swipe state
-------------------------- */
export const swipeState = reactive({
  lanes: {},
  gesture: {
    active: false,
    start: { x: 0, y: 0 },
    last: { x: 0, y: 0 },
    axis: null,
    laneId: null,
    swipeType: null,
    baseAxis: 0,
    basePoint: { x: 0, y: 0 }
  }
})

export function getLane(laneId) {
  return swipeState.lanes[laneId] || null
}

/* -------------------------
   Gesture helpers
-------------------------- */
export function beginGesture({ x, y, axis, laneId, swipeType, baseAxis = 0, basePoint = { x: 0, y: 0 } }) {
  swipeState.gesture.active = true
  swipeState.gesture.start.x = x
  swipeState.gesture.start.y = y
  swipeState.gesture.last.x = x
  swipeState.gesture.last.y = y
  swipeState.gesture.axis = axis || null
  swipeState.gesture.laneId = laneId || null
  swipeState.gesture.swipeType = swipeType || null
  swipeState.gesture.baseAxis = baseAxis || 0
  swipeState.gesture.basePoint = {
    x: basePoint.x || 0,
    y: basePoint.y || 0
  }
}

export function updateGesturePosition({ x, y }) {
  if (!swipeState.gesture.active) {
    return { rawDelta: { x: 0, y: 0 }, axisDelta: 0 }
  }

  const nextX = Number.isFinite(x) ? x : swipeState.gesture.last.x
  const nextY = Number.isFinite(y) ? y : swipeState.gesture.last.y

  swipeState.gesture.last.x = nextX
  swipeState.gesture.last.y = nextY

  const rawDelta = {
    x: nextX - swipeState.gesture.start.x,
    y: nextY - swipeState.gesture.start.y
  }
  const axisDelta = swipeState.gesture.axis === 'horizontal'
    ? rawDelta.x
    : swipeState.gesture.axis === 'vertical'
      ? rawDelta.y
      : 0

  return { rawDelta, axisDelta }
}

export function getGestureDeltas() {
  if (!swipeState.gesture.active) {
    return { rawDelta: { x: 0, y: 0 }, axisDelta: 0 }
  }

  const rawDelta = {
    x: swipeState.gesture.last.x - swipeState.gesture.start.x,
    y: swipeState.gesture.last.y - swipeState.gesture.start.y
  }
  const axisDelta = swipeState.gesture.axis === 'horizontal'
    ? rawDelta.x
    : swipeState.gesture.axis === 'vertical'
      ? rawDelta.y
      : 0

  return { rawDelta, axisDelta }
}

export function endGesture() {
  swipeState.gesture.active = false
  swipeState.gesture.start.x = 0
  swipeState.gesture.start.y = 0
  swipeState.gesture.last.x = 0
  swipeState.gesture.last.y = 0
  swipeState.gesture.axis = null
  swipeState.gesture.laneId = null
  swipeState.gesture.swipeType = null
  swipeState.gesture.baseAxis = 0
  swipeState.gesture.basePoint = { x: 0, y: 0 }
}

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
      committedOffset: 0,
      count: 0,
      pendingDir: null,
      dragging: false,
      size: 0, // width or height of lane (axis-aligned)
      bounds: { width: 0, height: 0 }, // freeform bounds for drag
      dragPosition: { x: 0, y: 0 },
      direction: null
    }
  }
  return swipeState.lanes[laneId]
}

export function updateLaneMetrics(laneId, { size, bounds, count, direction } = {}) {
  const lane = ensureLane(laneId)
  if (Number.isFinite(size)) {
    lane.size = size
  }
  if (bounds) {
    lane.bounds = {
      width: Number.isFinite(bounds.width) ? bounds.width : 0,
      height: Number.isFinite(bounds.height) ? bounds.height : 0
    }
  }
  if (Number.isFinite(count)) {
    lane.count = Math.max(0, count)
    lane.index = clamp(lane.index, 0, lane.count ? lane.count - 1 : 0)
  }
  if (direction) {
    lane.direction = direction
  }
  return lane
}

export function setLaneCount(laneId, count) {
  return updateLaneMetrics(laneId, { count })
}

export function setLaneIndex(laneId, index) {
  const lane = ensureLane(laneId)
  lane.index = clamp(index, 0, lane.count - 1)
  lane.offset = 0
  lane.pendingDir = null
}

export function setLaneSize(laneId, size) {
  updateLaneMetrics(laneId, { size })
}

export function setLaneBounds(laneId, width, height) {
  updateLaneMetrics(laneId, { bounds: { width, height } })
}

export function setLaneDragging(laneId, dragging) {
  ensureLane(laneId).dragging = dragging
}

export function setDragPosition(laneId, position) {
  const lane = ensureLane(laneId)
  lane.dragPosition = {
    x: position?.x || 0,
    y: position?.y || 0
  }
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

export function completeLaneCommit(laneId) {
  const lane = swipeState.lanes[laneId]
  if (!lane || !lane.pendingDir) return
  if (lane.count) {
    if (lane.pendingDir === 'right' || lane.pendingDir === 'down') lane.index -= 1
    if (lane.pendingDir === 'left' || lane.pendingDir === 'up') lane.index += 1
    lane.index = clamp(lane.index, 0, lane.count - 1)
    if (lane.count > 0) {
      lane.index = ((lane.index % lane.count) + lane.count) % lane.count
    }
  }
  lane.offset = 0
  lane.pendingDir = null
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
export function clampValue(v, min, max) {
  if (max < min) return min
  return Math.min(Math.max(v, min), max)
}

function clamp(v, min, max) {
  return clampValue(v, min, max)
}