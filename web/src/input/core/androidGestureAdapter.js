// input/core/androidGestureAdapter.js
/**
 * Bridges Android gesture position updates to JavaScript gesture events.
 * Converts position deltas from Kotlin into SWIPE_MOVE/SWIPE_END events
 * that carouselGestureController already listens to.
 */

import { gestureBus } from '../bus/gestureBus'
import { GestureType } from '../bus/gestureTypes'
import { log } from '../debug/gestureDebug'
import { APP_SETTINGS } from '../../config/appSettings'
import { gestureTargetRegistry } from './gestureTargetRegistry'

const adapterState = {
  swipeAxis: null,
  totalDelta: 0,
  hasStarted: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  isPressing: false,      // Track if we're in press state (not swiping)
  pressElement: null,     // Element that was pressed
  swipeElement: null      // Registered element handling the swipe
}

export const androidGestureAdapter = {
  /**
   * Called by Kotlin when user puts finger down
   * Kotlin sends normalized coords (364x800), but elementFromPoint needs viewport coords.
   * @param {number} x - Normalized X coordinate (BASE_WIDTH=364)
   * @param {number} y - Normalized Y coordinate (BASE_HEIGHT=800)
   */
  onSwipeDown(x, y) {
    adapterState.lastX = x
    adapterState.lastY = y
    adapterState.startX = x
    adapterState.startY = y
    adapterState.swipeAxis = null
    adapterState.totalDelta = 0
    adapterState.hasStarted = false
    adapterState.isPressing = true
    
    // Convert normalized coords to viewport coords for elementFromPoint
    // Kotlin sends 364x800 space, but viewport is scaled via CSS transform
    const scale = window.__APP_SCALE || 1
    const viewportX = x * scale
    const viewportY = y * scale
    
    if (!window.__APP_SCALE) {
      log('elementMatching', '⚠️ __APP_SCALE not set, using scale=1 (may cause coordinate mismatch)')
    }
    
    log('elementMatching', `Coordinate conversion: normalized(${x},${y}) * ${scale} = viewport(${viewportX.toFixed(1)},${viewportY.toFixed(1)})`)
    
    // Match jsEngine: Get ALL elements at point, find first registered target
    const elements = document.elementsFromPoint(viewportX, viewportY)
    adapterState.pressElement = elements.find(el => gestureTargetRegistry.hasTarget(el)) || null

    log('elementMatching', 'Press target:', adapterState.pressElement)

    // Emit PRESS_START (matches jsEngine)
    gestureBus.emit(GestureType.PRESS_START, { x, y, el: adapterState.pressElement })
    log('androidAdapter', `PRESS_START at (${x},${y})`)
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
      if (distFromStartX < APP_SETTINGS.input.swipeThreshold && distFromStartY < APP_SETTINGS.input.swipeThreshold) {
        return // Not enough movement yet, don't emit
      }

      // Determine dominant direction
      adapterState.swipeAxis = distFromStartX > distFromStartY ? 'horizontal' : 'vertical'
      
      // Reset last position to start (matches jsEngine behavior)
      // This ensures first delta is calculated from axis-detection point, not from Down
      if (adapterState.swipeAxis === 'horizontal') {
        adapterState.lastX = adapterState.startX
      } else {
        adapterState.lastY = adapterState.startY
      }
      
      log('androidAdapter', `Axis detected: ${adapterState.swipeAxis}`)

      // Convert normalized start coords to viewport coords for elementFromPoint
      const scale = window.__APP_SCALE || 1
      const viewportStartX = adapterState.startX * scale
      const viewportStartY = adapterState.startY * scale

      // Match jsEngine: Get ALL elements at START point, find first registered target for this axis
      const originElements = document.elementsFromPoint(viewportStartX, viewportStartY)
      const registeredElement = originElements.find(el => gestureTargetRegistry.hasSwipe(el, adapterState.swipeAxis)) || null

      log('elementMatching', 'Swipe target:', registeredElement, 'axis:', adapterState.swipeAxis)

      if (!registeredElement) {
        // No registered target found - ignore swipe (matches jsEngine)
        log('elementMatching', 'No registered swipe target, ignoring')
        adapterState.isPressing = false
        adapterState.swipeAxis = null // Reset so we don't try again
        return
      }

      // Store the registered element that will handle this swipe
      adapterState.swipeElement = registeredElement
      adapterState.hasStarted = true

      // Get lane ID from registered element
      const laneId = registeredElement.dataset?.lane || 'wallpaper'

      // Emit swipe start event
      gestureBus.emit(GestureType.SWIPE_START, {
        el: registeredElement,
        axis: adapterState.swipeAxis,
        laneId,
        x,
        y
      })
      log('fsmTransitions', 'SWIPE_START', adapterState.swipeAxis)
      
      // No longer a press once swiping starts
      adapterState.isPressing = false
      
      // Update current position to last (matches jsEngine behavior)
      // jsEngine only updates axis coordinate here, but for androidAdapter
      // we update both since we don't track moves during PRESS_PENDING
      adapterState.lastX = x
      adapterState.lastY = y
      
      // Return early (matches jsEngine: axis detection move doesn't emit SWIPE_MOVE)
      return
    }

    // Calculate delta in the swipe direction
    const deltaX = x - adapterState.lastX
    const deltaY = y - adapterState.lastY
    const delta = adapterState.swipeAxis === 'horizontal' ? deltaX : deltaY
    adapterState.totalDelta += delta

    // Get lane ID from the registered swipe element
    const laneId = adapterState.swipeElement?.dataset?.lane || 'wallpaper'

    // Emit move event
    gestureBus.emit(GestureType.SWIPE_MOVE, {
      el: adapterState.swipeElement,
      delta,
      total: adapterState.totalDelta,
      axis: adapterState.swipeAxis,
      laneId,
      x,
      y
    })

    log('fsmMove', `${adapterState.swipeAxis} delta`, { delta, total: adapterState.totalDelta })
    log('swipeMovement', `${adapterState.swipeAxis}`, { delta, accum: adapterState.totalDelta })

    // Update for next delta calculation (match jsEngine: only update axis coordinate)
    if (adapterState.swipeAxis === 'horizontal') {
      adapterState.lastX = x
    } else {
      adapterState.lastY = y
    }
  },

  /**
   * Called by Kotlin when momentum animation completes
   */
  onSwipeEnd() {
    if (adapterState.hasStarted && adapterState.swipeAxis && adapterState.swipeElement) {
      // Use the registered swipe element
      const laneId = adapterState.swipeElement.dataset?.lane || 'wallpaper'

      gestureBus.emit(GestureType.SWIPE_END, {
        el: adapterState.swipeElement,
        total: adapterState.totalDelta,
        axis: adapterState.swipeAxis,
        laneId
      })

      log('fsmTransitions', 'SWIPE_END', { axis: adapterState.swipeAxis, total: adapterState.totalDelta })
    } else if (adapterState.isPressing && adapterState.pressElement) {
      // Finger lifted without swiping = tap/press event
      // pressElement is already validated in onSwipeDown, no need to check again
      gestureBus.emit(GestureType.PRESS_END, { el: adapterState.pressElement })
      log('fsmTransitions', 'PRESS_END')
    }

    // Reset state
    adapterState.swipeAxis = null
    adapterState.totalDelta = 0
    adapterState.hasStarted = false
    adapterState.isPressing = false
    adapterState.pressElement = null
    adapterState.swipeElement = null
  },

  // Debug methods
  getState() {
    return {
      swipeAxis: adapterState.swipeAxis,
      totalDelta: adapterState.totalDelta,
      hasStarted: adapterState.hasStarted,
      isPressing: adapterState.isPressing,
      pressElement: adapterState.pressElement,
      swipeElement: adapterState.swipeElement,
      lastPos: { x: adapterState.lastX, y: adapterState.lastY },
      startPos: { x: adapterState.startX, y: adapterState.startY }
    }
  }
}

