import { clampSwipe, clampDelta2D } from '../engine/gestureBounds'
import { log } from '../../debug/functions'
import { scale } from '../../state/sizeState'

/**
 * Compute clamped swipe delta for all swipe types
 * @param {Object} params
 * @param {Object} params.payload - { delta, rawDelta, raw, axis }
 * @param {Object} params.target - { swipeType, laneId }
 * @param {Object} params.base - { axis, drag, size }
 * @param {Object} [params.parent] - viewport/container bounds
 * @returns {number|Object} - numeric for axis swipes, {x,y,delta} for drag, optionally normalized for slider
 */
export function computeSwipeDelta({ payload, target, base, parent }) {
  if (!target) return null
  const { swipeType, laneId } = target

  // -------------------------
  // DRAG: 2D delta
  // -------------------------
  if (swipeType === 'drag') {
    const basePos = base.drag?.[laneId]
    const raw = payload.raw || payload.rawDelta

    if (!basePos || !raw) return null

    // Convert raw pointer to scaled CSS pixels
    const scaledRaw = {
      x: raw.x,
      y: raw.y
    }

    // Delta relative to gesture start/base
    const delta = {
      x: scaledRaw.x - (basePos.x || 0),
      y: scaledRaw.y - (basePos.y || 0)
    }

    log('swipe', { raw, scaledRaw, delta })

    const clamped = clampDelta2D({
      type: 'swipeDrag',
      delta,
      base: basePos,
      parent
    }).clamped

    // Return clamped absolute position plus delta for Drag.vue
    return {
      x: clamped.x,
      y: clamped.y,
      delta: { ...delta } // optional: raw delta for renderer logic
    }
  }

  // -------------------------
  // SLIDER or CAROUSEL: 1D delta
  // -------------------------
  const { clampedDelta, normalized } = clampSwipe({
    type: swipeType === 'slider' ? 'swipeSlider' : 'swipeCarousel',
    axis: payload.axis,
    delta: payload.delta,
    base: base.axis[laneId],
    size: base.size[laneId],
    parentSize: parent?.[payload.axis === 'x' ? 'width' : 'height']
  })

  return swipeType === 'slider'
    ? { delta: clampedDelta, normalized }
    : clampedDelta
}

/**
 * Compute delta for commit phase
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