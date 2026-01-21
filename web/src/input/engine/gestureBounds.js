// src/input/engine/gestureBounds.js
/**
 * gestureBounds.js
 *
 * Responsibilities:
 * - Clamp swipe/drag deltas according to type
 * - Provide normalized 0-1 values for sliders
 * - Works with sizeState for viewport scaling
 */

import { getAxisSize } from '../../state/sizeState'

/**
 * Clamp a value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function clamp01(value) {
  return clamp(value, 0, 1)
}

// Clamp a delta by first converting it to absolute space, then returning the
// delta needed to reach the clamped absolute. This keeps relative deltas out
// of the clamp math and preserves the base snapshot the renderer owns.
function clampDeltaAgainstBounds(base, delta, min, max) {
  const absolute = base + delta
  const clampedAbsolute = clamp(absolute, min, max)
  return {
    clampedDelta: clampedAbsolute - base,
    clampedAbsolute
  }
}

/**
 * Bounds a swipe based on its type
 * @param {Object} params
 * @param {string} params.type - 'swipeCarousel' | 'swipeSlider' | 'swipeDrag'
 * @param {string} params.axis - 'x' | 'y' | 'horizontal' | 'vertical'
 * @param {number} params.delta - Current delta
 * @param {number} params.base - Base position (e.g., lane drag start)
 * @param {number} [params.parentSize] - Parent container size (for slider)
 * @returns {{clampedDelta: number, normalized?: number, normalizedPercent?: number}}
 */
export function clampSwipe({ type, axis, delta, base, parentSize, size }) {
  const baseValue = typeof base === 'number' ? base : 0
  const deltaValue = typeof delta === 'number' ? delta : 0

  if (type === 'swipeCarousel') {
    // Carousel is unbounded
    return { clampedDelta: deltaValue }
  }

  if (type === 'swipeSlider') {
    // Slider is clamped to provided size (lane), then axis size fallback
    const axisSize = getAxisSize(axis)
    const boundSize =
      typeof size === 'number' ? size :
      typeof parentSize === 'number' ? parentSize :
      (typeof axisSize === 'number' ? axisSize : 0)

    // Use delta as-is so axis direction (horizontal or vertical) is preserved before clamping
    const { clampedDelta, clampedAbsolute } = clampDeltaAgainstBounds(baseValue, deltaValue, 0, boundSize)
    const normalized = boundSize > 0 ? clamp01(clampedAbsolute / boundSize) : 0
    const normalizedPercent = normalized * 100
    return { clampedDelta, normalized, normalizedPercent }
  }

  if (type === 'swipeDrag') {
    // Drag is clamped to viewport size
    const axisSize = getAxisSize(axis)
    const boundSize = typeof axisSize === 'number' ? axisSize : 0
    const { clampedDelta } = clampDeltaAgainstBounds(baseValue, deltaValue, 0, boundSize)
    return { clampedDelta }
  }

  // Default fallback
  return { clampedDelta: deltaValue }
}

/**
 * Clamp a 2D delta object {x, y} according to type
 * @param {Object} params
 * @param {string} params.type
 * @param {{x:number, y:number}} params.delta
 * @param {{x:number, y:number}} params.base
 * @param {{width?:number, height?:number}} [params.parent] - For slider
 * @returns {{clamped: {x:number, y:number}, normalized?: {x:number, y:number}}}
 */
export function clampDelta2D({ type, delta, base, parent }) {
  const resultX = clampSwipe({
    type,
    axis: 'x',
    delta: delta.x,
    base: base?.x ?? 0,
    parentSize: parent?.width
  })
  const resultY = clampSwipe({
    type,
    axis: 'y',
    delta: delta.y,
    base: base?.y ?? 0,
    parentSize: parent?.height
  })

  const clamped = { x: resultX.clampedDelta, y: resultY.clampedDelta }
  const normalized =
    type === 'swipeSlider'
      ? { x: resultX.normalized ?? 0, y: resultY.normalized ?? 0 }
      : undefined

  return { clamped, normalized }
}