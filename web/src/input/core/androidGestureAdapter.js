// input/core/androidGestureAdapter.js
/**
 * Bridges Android gesture position updates to JavaScript gesture events.
 * Converts position deltas from Kotlin into SWIPE_MOVE/SWIPE_END events
 * that carouselGestureController already listens to.
 */

import { gestureBus } from '../bus/gestureBus'
import { GestureType } from '../bus/gestureTypes'
import { log } from '../debug/gestureDebug'

let lastX = 0
let lastY = 0
let startX = 0
let startY = 0
let swipeAxis = null
let totalDelta = 0
let hasStarted = false

export const androidGestureAdapter = {
  /**
   * Called by Kotlin when user puts finger down
   * @param {number} x - Initial X coordinate
   * @param {number} y - Initial Y coordinate
   */
  onSwipeDown(x, y) {
    lastX = x
    lastY = y
    startX = x
    startY = y
    swipeAxis = null
    totalDelta = 0
    hasStarted = false

    log('androidAdapter', 'DOWN', { x, y })
  },

  /**
   * Called by Kotlin on each position update
   * (Both during active touch AND during momentum animation)
   * @param {number} x - Current X coordinate
   * @param {number} y - Current Y coordinate
   */
  onSwipeMove(x, y) {
    const deltaX = x - lastX
    const deltaY = y - lastY

    // Detect axis on first significant movement
    if (!swipeAxis) {
      const distFromStartX = Math.abs(x - startX)
      const distFromStartY = Math.abs(y - startY)

      // Threshold: 8px movement (same as jsEngine)
      if (distFromStartX < 8 && distFromStartY < 8) {
        return // Not enough movement yet, don't emit
      }

      // Determine dominant direction
      swipeAxis = distFromStartX > distFromStartY ? 'horizontal' : 'vertical'

      // Emit swipe start event
      if (!hasStarted) {
        gestureBus.emit(GestureType.SWIPE_START, {
          axis: swipeAxis,
          x,
          y
        })
        hasStarted = true
        log('fsmTransitions', 'Android SWIPE_START', swipeAxis)
      }
    }

    // Calculate delta in the swipe direction
    const delta = swipeAxis === 'horizontal' ? deltaX : deltaY
    totalDelta += delta

    // Emit move event (swipeLaneController listens to this)
    gestureBus.emit(GestureType.SWIPE_MOVE, {
      delta,
      total: totalDelta,
      axis: swipeAxis,
      x,
      y
    })

    log('fsmMove', 'Android move', { delta, total: totalDelta, axis: swipeAxis })
    log('swipeMovement', `Android ${swipeAxis}`, { delta, accum: totalDelta })

    // Update for next delta calculation
    lastX = x
    lastY = y
  },

  /**
   * Called by Kotlin when momentum animation completes
   */
  onSwipeEnd() {
    if (hasStarted && swipeAxis) {
      gestureBus.emit(GestureType.SWIPE_END, {
        total: totalDelta,
        axis: swipeAxis
      })

      log('fsmTransitions', 'Android SWIPE_END', { axis: swipeAxis, total: totalDelta })
    }

    // Reset state
    swipeAxis = null
    totalDelta = 0
    hasStarted = false
  },

  // Debug methods
  getState() {
    return {
      swipeAxis,
      totalDelta,
      hasStarted,
      lastPos: { x: lastX, y: lastY },
      startPos: { x: startX, y: startY }
    }
  }
}

