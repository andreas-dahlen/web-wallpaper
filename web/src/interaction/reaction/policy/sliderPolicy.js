// sliderPolicy.js
/**
 * Pure decision logic for slider behavior.
 * 
 * Contract:
 * - NO reactive state
 * - NO side effects
 * - NO DOM access
 * - Pure functions only
 * 
 * This is exactly like carousel, except:
 * - No revert (always commits on release)
 * - Quantized movement to step boundaries
 */

/**
 * Clamp delta to slider bounds
 * @param {number} delta - Current swipe delta
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped delta
 */
export function pixelToLogical(delta, laneSize, min, max) {
  if (!laneSize) return 0
  return (delta / laneSize) * (max - min)
}

export function clampDelta(value, min, max) {
  return Math.min(max, Math.max(min, value))
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
 * Quantize delta to nearest step
 * @param {number} delta - Current delta
 * @param {number} stepSize - Size of each step
 * @returns {number} Quantized delta
 */
export function quantizeDelta(delta, stepSize) {
  if (!stepSize) return delta
  return Math.round(delta / stepSize) * stepSize
}

/**
 * Compute commit delta for slider (quantized to step)
 * @param {number} delta - Current delta
 * @param {number} stepSize - Size of each step
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Commit delta (quantized and clamped)
 */
export function getCommitDelta(delta, stepSize, min, max) {
  const quantized = quantizeDelta(delta, stepSize)
  return clampDelta(quantized, min, max)
}
