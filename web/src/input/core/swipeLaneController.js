// src/input/core/swipeLaneController.js
import { gestureBus } from '../bus/gestureBus'
import { GestureType } from '../bus/gestureTypes'
import {
  ensureLane,
  applyLaneOffset,
  commitLaneSwipe
} from '../../state/swipeState'
import { APP_SETTINGS } from '../../config/appSettings'

const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeViewChangeThreshold || 40

let activeLane = null
let activeAxis = null
let totalDelta = 0

export function initSwipeLaneController() {
  gestureBus.on(GestureType.SWIPE_START, onSwipeStart)
  gestureBus.on(GestureType.SWIPE_MOVE, onSwipeMove)
  gestureBus.on(GestureType.SWIPE_END, onSwipeEnd)
}

function onSwipeStart({ el, axis }) {
  // TouchArea must define which lane it belongs to
  const laneId = el?.dataset?.lane
  if (!laneId) return

  activeLane = laneId
  activeAxis = axis
  totalDelta = 0

  ensureLane(laneId)
}

function onSwipeMove({ delta }) {
  if (!activeLane) return

  totalDelta += delta
  applyLaneOffset(activeLane, totalDelta)
}

function onSwipeEnd() {
  if (!activeLane) return

  if (Math.abs(totalDelta) > SWIPE_THRESHOLD) {
    const dir = totalDelta > 0 ? 'right' : 'left'
    commitLaneSwipe(activeLane, dir)
  } else {
    // snap back
    applyLaneOffset(activeLane, 0)
  }

  reset()
}

function reset() {
  activeLane = null
  activeAxis = null
  totalDelta = 0
}
