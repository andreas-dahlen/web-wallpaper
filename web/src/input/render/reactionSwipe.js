import { clampSwipe, clampDelta2D } from '../engine/gestureBounds'

/**
 * Compute clamped swipe delta for all swipe types
 * @param {Object} params
 * @param {Object} params.payload - { delta, rawDelta, axis }
 * @param {Object} params.target - { swipeType, laneId }
 * @param {Object} params.base - { axis, drag, size }
 * @param {Object} [params.parent] - viewport/container bounds
 * @returns {number|Object} - numeric for axis swipes, {x,y} for drag, optionally normalized for slider
 */
export function computeSwipeDelta({ payload, target, base, parent }) {
  if (!target) return null
  const { swipeType, laneId } = target

  // DRAG: 2D delta clamped to viewport/container bounds
  if (swipeType === 'drag') {
    const raw = payload.rawDelta || payload.delta || { x: 0, y: 0 }
    return clampDelta2D({
      type: 'swipeDrag',
      delta: raw,
      base: base.drag?.[laneId],
      parent // viewport/container
    }).clamped
  }

  // SLIDER or CAROUSEL: 1D delta
  const { clampedDelta, normalized } = clampSwipe({
    type: swipeType === 'slider' ? 'swipeSlider' : 'swipeCarousel',
    axis: payload.axis,
    delta: payload.delta,
    base: base.axis[laneId],
    size: base.size[laneId],
    parentSize: parent?.[payload.axis === 'x' ? 'width' : 'height']
  })

  // Slider exposes normalized progress, carousel is numeric passthrough
  return swipeType === 'slider'
    ? { delta: clampedDelta, normalized }
    : clampedDelta
}

/**
 * Compute delta for commit phase
 * Simply reuses computeSwipeDelta
 */
export function computeCommitDelta(args) {
  return computeSwipeDelta(args)
}

/**
 * Swipe always allowed? Only drag & slider
 */
export function swipeAlwaysAllowed(target) {
  const swipeType = target?.swipeType
  return swipeType === 'drag' || swipeType === 'slider'
}