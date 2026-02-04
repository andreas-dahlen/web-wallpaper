// dragPolicy.js
/**
 * Pure decision logic for drag behavior.
 * 
 * Contract:
 * - NO reactive state
 * - NO side effects
 * - NO DOM access
 * - Pure functions only
 * 
 * This is exactly like carousel, except:
 * - 2D deltas (x, y) instead of single axis
 * - No commit threshold (always commits on release)
 * - No revert behavior
 */

/**
 * Clamp delta to bounds
 * @param {number} delta - Current drag delta
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped delta
 */
export function clampDelta(delta, min, max) {
  if (min === undefined || max === undefined) return delta
  return Math.max(min, Math.min(max, delta))
}

/**
 * Clamp 2D delta to bounds
 * @param {number} deltaX - X delta
 * @param {number} deltaY - Y delta
 * @param {{ minX?: number, maxX?: number, minY?: number, maxY?: number }} bounds
 * @returns {{ x: number, y: number }} Clamped deltas
 */
export function clampDelta2D(deltaX, deltaY, bounds = {}) {
  const { minX, maxX, minY, maxY } = bounds
  return {
    x: clampDelta(deltaX, minX, maxX),
    y: clampDelta(deltaY, minY, maxY)
  }
}

/**
 * Resolve drag direction from deltas
 * @param {number} deltaX - X delta
 * @param {number} deltaY - Y delta
 * @returns {string|null} Direction: 'left'|'right'|'up'|'down' or null (based on dominant axis)
 */
export function resolveDirection(deltaX, deltaY) {
  if (deltaX === 0 && deltaY === 0) return null
  
  // Dominant axis determines direction
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX > 0 ? 'right' : 'left'
  }
  return deltaY > 0 ? 'down' : 'up'
}

/**
 * Compute commit delta for drag (identity - always commit at current position)
 * @param {number} deltaX - X delta
 * @param {number} deltaY - Y delta
 * @returns {{ x: number, y: number }} Commit delta (same as input for drag)
 */
export function getCommitDelta(deltaX, deltaY) {
  return { x: deltaX, y: deltaY }
}
