// swipePolicy.js
/**
 * Pure decision logic for swipe/carousel behavior.
 * 
 * Contract:
 * - NO reactive state
 * - NO side effects
 * - NO DOM access
 * - Pure functions only
 */

import { APP_SETTINGS } from '../../../config/appSettings'

/**
 * Clamp delta to lane boundaries
 * @param {number} delta - Current swipe delta
 * @param {number} laneSize - Size of the lane
 * @returns {number} Clamped delta
 */
export function clampDelta(delta, laneSize) {
  if (!laneSize) return delta
  return Math.max(-laneSize, Math.min(laneSize, delta))
}

/**
 * Resolve swipe direction from delta and axis
 * @param {number} delta - Swipe delta (clamped)
 * @param {string} axis - 'horizontal' or 'vertical'
 * @returns {string|null} Direction: 'left'|'right'|'up'|'down' or null
 */
export function resolveDirection(delta, axis) {
  if (delta === 0) return null
  if (axis === 'horizontal') {
    return delta > 0 ? 'right' : 'left'
  }
  return delta > 0 ? 'down' : 'up'
}

/**
 * Determine if swipe should commit based on distance threshold
 * @param {number} delta - Swipe delta (clamped)
 * @param {number} laneSize - Size of the lane
 * @returns {boolean} True if should commit
 */
export function shouldCommit(delta, laneSize) {
  if (!laneSize) return false
  const threshold = laneSize * APP_SETTINGS.swipeCommitRatio
  return Math.abs(delta) >= threshold
}

/**
 * Calculate the target offset for a commit animation
 * @param {string} direction - 'left'|'right'|'up'|'down'
 * @param {number} laneSize - Size of the lane
 * @returns {number} Target offset
 */
export function getCommitOffset(direction, laneSize) {
  if (!laneSize) return 0
  if (direction === 'right' || direction === 'down') return laneSize
  if (direction === 'left' || direction === 'up') return -laneSize
  return 0
}

/**
 * Calculate new index after commit
 * @param {number} currentIndex - Current lane index
 * @param {string} direction - Commit direction
 * @param {number} count - Total item count
 * @returns {number} New index (wrapped)
 */
export function getNextIndex(currentIndex, direction, count) {
  if (!count) return 0
  switch (direction) {
    case 'right':
    case 'down':
      return (currentIndex - 1 + count) % count
    case 'left':
    case 'up':
      return (currentIndex + 1) % count
    default:
      return currentIndex
  }
}
