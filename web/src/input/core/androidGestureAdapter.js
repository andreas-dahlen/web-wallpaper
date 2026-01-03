// input/core/androidGestureAdapter.js
/**
 * Bridges Android gesture position updates to JavaScript gesture events.
 * Converts position deltas from Kotlin into SWIPE_MOVE/SWIPE_END events
 * that carouselGestureController already listens to.
 */

import { gestureBus } from '../bus/gestureBus'
import { GestureType } from '../bus/gestureTypes'
import { log } from '../debug/gestureDebug'

const adapterState = {
  swipeAxis: null,
  totalDelta: 0,
  hasStarted: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0
}

export const androidGestureAdapter = {
  /**
   * Called by Kotlin when user puts finger down
   * @param {number} x - Initial X coordinate
   * @param {number} y - Initial Y coordinate
   */
  onSwipeDown(x, y) {
    adapterState.lastX = x
    adapterState.lastY = y
    adapterState.startX = x
    adapterState.startY = y
    adapterState.swipeAxis = null
    adapterState.totalDelta = 0
    adapterState.hasStarted = false

    log('androidAdapter', 'DOWN', { x, y })
  },

  /**
   * Called by Kotlin on each position update
   * (Both during active touch AND during momentum animation)
   * @param {number} x - Current X coordinate
   * @param {number} y - Current Y coordinate
   */
  onSwipeMove(x, y) {
    // Detect axis on first significant movement
    if (!adapterState.swipeAxis) {
      const distFromStartX = Math.abs(x - adapterState.startX)
      const distFromStartY = Math.abs(y - adapterState.startY)

      // Threshold: 8px movement (same as jsEngine)
      if (distFromStartX < 8 && distFromStartY < 8) {
        return // Not enough movement yet, don't emit
      }

      // Determine dominant direction
      adapterState.swipeAxis = distFromStartX > distFromStartY ? 'horizontal' : 'vertical'
      adapterState.hasStarted = true

      // Find which element is at these coordinates (same as jsEngine via elementFromPoint)
      const element = document.elementFromPoint(x, y)
      const laneId = element?.dataset?.lane || 'wallpaper'

      // Emit swipe start event
      gestureBus.emit(GestureType.SWIPE_START, {
        axis: adapterState.swipeAxis,
        laneId,
        x,
        y
      })
      log('fsmTransitions', 'Android SWIPE_START', adapterState.swipeAxis)
    }

    // Calculate delta in the swipe direction
    const deltaX = x - adapterState.lastX
    const deltaY = y - adapterState.lastY
    const delta = adapterState.swipeAxis === 'horizontal' ? deltaX : deltaY
    adapterState.totalDelta += delta

    // Find element at current position for lane
    const element = document.elementFromPoint(x, y)
    const laneId = element?.dataset?.lane || 'wallpaper'

    // Emit move event
    gestureBus.emit(GestureType.SWIPE_MOVE, {
      delta,
      total: adapterState.totalDelta,
      axis: adapterState.swipeAxis,
      laneId,
      x,
      y
    })

    log('fsmMove', 'Android move', { delta, total: adapterState.totalDelta, axis: adapterState.swipeAxis })
    log('swipeMovement', `Android ${adapterState.swipeAxis}`, { delta, accum: adapterState.totalDelta })

    // Update for next delta calculation
    adapterState.lastX = x
    adapterState.lastY = y
  },

  /**
   * Called by Kotlin when momentum animation completes
   */
  onSwipeEnd() {
    if (adapterState.hasStarted && adapterState.swipeAxis) {
      // Find element at last position for lane
      const element = document.elementFromPoint(adapterState.lastX, adapterState.lastY)
      const laneId = element?.dataset?.lane || 'wallpaper'

      gestureBus.emit(GestureType.SWIPE_END, {
        total: adapterState.totalDelta,
        axis: adapterState.swipeAxis,
        laneId
      })

      log('fsmTransitions', 'Android SWIPE_END', { axis: adapterState.swipeAxis, total: adapterState.totalDelta })
    }

    // Reset state
    adapterState.swipeAxis = null
    adapterState.totalDelta = 0
    adapterState.hasStarted = false
  },

  // Debug methods
  getState() {
    return {
      swipeAxis: adapterState.swipeAxis,
      totalDelta: adapterState.totalDelta,
      hasStarted: adapterState.hasStarted,
      lastPos: { x: adapterState.lastX, y: adapterState.lastY },
      startPos: { x: adapterState.startX, y: adapterState.startY }
    }
  }
}

