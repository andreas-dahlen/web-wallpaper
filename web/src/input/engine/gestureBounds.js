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

/* -------------------------
   Helpers
-------------------------- */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function clamp01(value) {
  return clamp(value, 0, 1)
}

// Map axis aliases to canonical axis keys
function normalizeAxis(axis) {
  if (!axis) return 'x'
  if (axis === 'horizontal') return 'x'
  if (axis === 'vertical') return 'y'
  return axis // assume 'x' or 'y'
}

// Clamp a delta relative to a base and return clamped delta + absolute
function clampDeltaAgainstBounds(base, delta, min, max) {
  const absolute = base + delta
  const clampedAbsolute = clamp(absolute, min, max)
  return {
    clampedDelta: clampedAbsolute - base,
    clampedAbsolute
  }
}

/* -------------------------
   Main clamping
-------------------------- */

/**
 * Clamp a single-axis swipe
 * @param {Object} params
 * @param {string} params.type - 'swipeCarousel' | 'swipeSlider' | 'swipeDrag'
 * @param {string} params.axis - 'x' | 'y' | 'horizontal' | 'vertical'
 * @param {number} params.delta - Delta to clamp
 * @param {number} params.base - Base position
 * @param {number} [params.parentSize] - Size for slider
 * @param {number} [params.size] - Lane size for slider
 * @returns {{clampedDelta:number, normalized?:number, normalizedPercent?:number}}
 */
export function clampSwipe({ type, axis, delta, base, parentSize, size }) {
  const ax = normalizeAxis(axis)
  const baseValue = typeof base === 'number' ? base : 0
  const deltaValue = typeof delta === 'number' ? delta : 0

  if (type === 'swipeCarousel') {
    const max = typeof size === 'number' ? size : Infinity
    const { clampedDelta } = clampDeltaAgainstBounds(baseValue, deltaValue, -Infinity, max)
    return { clampedDelta }
  }

  if (type === 'swipeSlider') {
    const axisSize = getAxisSize(ax)
    const boundSize = typeof size === 'number'
      ? size
      : typeof parentSize === 'number'
        ? parentSize
        : typeof axisSize === 'number'
          ? axisSize
          : 0

    const { clampedDelta, clampedAbsolute } = clampDeltaAgainstBounds(
      baseValue,
      deltaValue,
      0,
      boundSize
    )

    const normalized = boundSize > 0 ? clamp01(clampedAbsolute / boundSize) : 0
    const normalizedPercent = normalized * 100

    return { clampedDelta, normalized, normalizedPercent }
  }

  // Drag delta clamping should prefer parent bounds
if (type === 'swipeDrag') {
  const boundSize = typeof parentSize === 'number' ? parentSize : (typeof getAxisSize(ax) === 'number' ? getAxisSize(ax) : 0)
  const { clampedDelta } = clampDeltaAgainstBounds(baseValue, deltaValue, 0, boundSize)
  return { clampedDelta }
}

  // fallback
  return { clampedDelta: deltaValue }
}

/* -------------------------
   2D deltas
-------------------------- */

/**
 * Clamp a 2D delta object
 * @param {Object} params
 * @param {string} params.type
 * @param {{x:number, y:number}} params.delta
 * @param {{x:number, y:number}} params.base
 * @param {{width?:number, height?:number}} [params.parent]
 * @returns {{clamped:{x:number, y:number}, normalized?:{x:number, y:number}}}
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
