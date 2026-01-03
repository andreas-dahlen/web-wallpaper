import { gestureBus } from '../bus/gestureBus'
import { GestureType } from '../bus/gestureTypes'
import { ensureLane, applyLaneOffset, commitLaneSwipe } from '../../state/swipeState'
import { APP_SETTINGS } from '../../config/appSettings'
import { log } from '../debug/gestureDebug'

const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeViewChangeThreshold || 40

let activeLane = null
let activeAxis = null
let totalDelta = 0

export function initCarouselGestureController() {
  gestureBus.on(GestureType.SWIPE_START, onSwipeStart)
  gestureBus.on(GestureType.SWIPE_MOVE, onSwipeMove)
  gestureBus.on(GestureType.SWIPE_END, onSwipeEnd)
}

function onSwipeStart({ el, axis }) {
  const laneId = el?.dataset?.lane
  if (!laneId) return

  activeLane = laneId
  activeAxis = axis
  totalDelta = 0

  const lane = ensureLane(laneId)
  lane.dragging = true
  lane.pendingDir = null
  
  log('carouselUpdates', 'Carousel swipe start', { lane: laneId, axis })
}

function onSwipeMove({ delta }) {
  if (!activeLane) return
  const lane = ensureLane(activeLane)
  if (!lane.dragging || lane.pendingDir) return

  totalDelta += delta
  applyLaneOffset(activeLane, totalDelta)
  
  log('swipeMovement', 'Carousel move', { lane: activeLane, delta, total: totalDelta })
}

function onSwipeEnd() {
  if (!activeLane || !activeAxis) return

  const lane = ensureLane(activeLane)

  // Commit swipe only if past threshold
  if (Math.abs(totalDelta) > SWIPE_THRESHOLD) {
    const dir =
      activeAxis === 'horizontal'
        ? totalDelta > 0 ? 'right' : 'left'
        : totalDelta > 0 ? 'down'  : 'up'

    log('carouselUpdates', 'Carousel swipe committed', { lane: activeLane, dir, total: totalDelta })
    commitLaneSwipe(activeLane, dir)
    lane.dragging = false  // Reset dragging state to allow transition
  } else {
    // Snap back if threshold not reached
    log('carouselUpdates', 'Carousel swipe rejected (under threshold)', { lane: activeLane, total: totalDelta, threshold: SWIPE_THRESHOLD })
    lane.offset = 0
    lane.pendingDir = null
    lane.dragging = false
  }

  // Reset local controller state
  activeLane = null
  activeAxis = null
  totalDelta = 0
}
