import { reactive } from 'vue'

// Pointer gesture tracking shared across engine/renderer
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
  dragPositions: {} // store last positions per lane
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
export function setDragPosition(lane, pos) {
  gestureState.dragPositions[lane] = { ...pos }
}

export function getDragPosition(lane) {
  return gestureState.dragPositions[lane] || { x: 0, y: 0 }
}
