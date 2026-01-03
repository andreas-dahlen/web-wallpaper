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

/**
 * Walk up DOM tree to find registered target for given axis.
 * Matches jsEngine behavior: checks element and parents.
 * @param {Element} element - Starting element
 * @param {string} axis - 'horizontal' or 'vertical'
 * @returns {Element|null} Registered element or null
 */
function findRegisteredSwipeTarget(element, axis) {
  if (!element) {
    log('elementMatching', `findRegisteredSwipeTarget called with null element`)
    return null
  }

  log('elementMatching', `Looking for ${axis} target starting from: <${element.tagName}> class="${element.className}" id="${element.id}" data-lane="${element.dataset?.lane || ''}"`)

  // Log what's in the registry
  log('elementMatching', `Registry contains ${gestureTargetRegistry.targets.size} registered targets`)

  let current = element
  let depth = 0
  const maxDepth = 8 // Increased from 5 to handle deeper nesting
  
  while (current && depth < maxDepth) {
    const hasSwipe = gestureTargetRegistry.hasSwipe(current, axis)
    log('elementMatching', `  Depth ${depth}: <${current.tagName}> class="${current.className}" hasSwipe=${hasSwipe}`)

    if (hasSwipe) {
      log('elementMatching', `✓ Found registered ${axis} target at depth ${depth}: <${current.tagName}> class="${current.className}"`)
      return current
    }
    current = current.parentElement
    depth++
  }
  
  log('elementMatching', `✗ No registered ${axis} target found after ${depth} levels`)
  return null
}

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
    
    log('elementMatching', `Coordinate conversion: normalized(${x},${y}) * ${scale} = viewport(${viewportX.toFixed(1)},${viewportY.toFixed(1)}) window=${window.innerWidth}x${window.innerHeight}`)
    
    // Find element at press location for potential tap event
    const element = document.elementFromPoint(viewportX, viewportY)
    adapterState.pressElement = element

    // Emit PRESS_START (matches jsEngine) - use normalized coords in event
    gestureBus.emit(GestureType.PRESS_START, { x, y, el: element })
    log('androidAdapter', `PRESS_START at (${x},${y})`)
    log('elementMatching', `Press target: <${element?.tagName}> class="${element?.className}"`)
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
      log('androidAdapter', `Axis detected: ${adapterState.swipeAxis}`)

      // Convert normalized start coords to viewport coords for elementFromPoint
      const scale = window.__APP_SCALE || 1
      const viewportStartX = adapterState.startX * scale
      const viewportStartY = adapterState.startY * scale

      // Find registered element at START position (matches jsEngine)
      const startElement = document.elementFromPoint(viewportStartX, viewportStartY)
      const registeredElement = findRegisteredSwipeTarget(startElement, adapterState.swipeAxis)

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

    // Update for next delta calculation
    adapterState.lastX = x
    adapterState.lastY = y
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
      // Only emit if element is registered for press events
      if (gestureTargetRegistry.hasTarget(adapterState.pressElement)) {
        gestureBus.emit(GestureType.PRESS_END, { el: adapterState.pressElement })
        log('fsmTransitions', 'PRESS_END')
      } else {
        log('elementMatching', 'Press on unregistered element, ignoring')
      }
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

