import { clampSwipe, clampDelta2D } from '../engine/gestureBounds'

export function computeSwipeDelta({ payload, target, base }) {
  if (!target) return null

  const { swipeType, laneId } = target

  // DRAG: 2D, clamped to viewport
  if (swipeType === 'drag') {
    const raw = payload.rawDelta || payload.delta || { x: 0, y: 0 }

    return clampDelta2D({
      type: 'swipeDrag',
      delta: raw,
      base: base.drag[laneId]
    }).clamped
  }

  // SLIDER or CAROUSEL: 1D
  const { clampedDelta, normalized } = clampSwipe({
    type: swipeType === 'slider' ? 'swipeSlider' : 'swipeCarousel',
    axis: payload.axis,
    delta: payload.delta,
    base: base.axis[laneId],
    size: base.size[laneId]
  })

  // Slider exposes normalized progress, carousel does not
  return swipeType === 'slider'
    ? { delta: clampedDelta, normalized }
    : clampedDelta
}

export function computeCommitDelta(args) {
  return computeSwipeDelta(args)
}

export function swipeAlwaysAllowed(target) {
  const swipeType = target?.swipeType
  return swipeType === 'drag' || swipeType === 'slider'
}
