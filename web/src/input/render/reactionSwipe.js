import { clampSwipe, clampDelta2D } from '../engine/gestureBounds'
import { log } from '../../debug/functions'
import { scale } from '../../state/sizeState'

// Normalize numbers and surface bad inputs early
function safeNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function safeScale() {
  const s = safeNumber(scale.value, 1)
  return s > 0 ? s : 1
}

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
  const scaleFactor = safeScale()

  // -------------------------
  // DRAG: 2D delta
  // -------------------------
  if (swipeType === 'drag') {
    const basePos = base.drag?.[laneId]
    const raw = payload.raw || payload.rawDelta

    if (!basePos || !raw) return null

    // Normalize pointer to scaled CSS pixels to match renderer-held bases
    const scaledRaw = {
      x: safeNumber(raw.x) / scaleFactor,
      y: safeNumber(raw.y) / scaleFactor
    }

    const scaledBase = {
      x: safeNumber(basePos.x) / scaleFactor,
      y: safeNumber(basePos.y) / scaleFactor
    }

    // Delta relative to gesture start/base in unified scaled space
    const delta = {
      x: scaledRaw.x - scaledBase.x,
      y: scaledRaw.y - scaledBase.y
    }

    log('swipe', { raw, scaledRaw, delta })

    const normalizedParent = parent
      ? {
          width: safeNumber(parent.width) / scaleFactor,
          height: safeNumber(parent.height) / scaleFactor
        }
      : undefined

    const clamped = clampDelta2D({
      type: 'swipeDrag',
      delta,
      base: scaledBase,
      parent: normalizedParent
    }).clamped

    // Return clamped absolute position plus delta for Drag.vue
    return {
      x: clamped.x * scaleFactor,
      y: clamped.y * scaleFactor,
      delta: {
        x: delta.x * scaleFactor,
        y: delta.y * scaleFactor
      }
    }
  }

  // -------------------------
  // SLIDER or CAROUSEL: 1D delta
  // -------------------------
  const axisKey = payload.axis === 'y' || payload.axis === 'vertical' ? 'y' : 'x'
  const deltaScaled = safeNumber(payload.delta) / scaleFactor
  const baseAxis = safeNumber(base.axis[laneId]) / scaleFactor
  const sizeAxis = safeNumber(base.size[laneId]) / scaleFactor
  const parentSize = safeNumber(parent?.[axisKey === 'x' ? 'width' : 'height']) / scaleFactor

  const { clampedDelta, normalized } = clampSwipe({
    type: swipeType === 'slider' ? 'swipeSlider' : 'swipeCarousel',
    axis: axisKey,
    delta: deltaScaled,
    base: baseAxis,
    size: sizeAxis,
    parentSize
  })

  return swipeType === 'slider'
    ? { delta: clampedDelta * scaleFactor, normalized }
    : clampedDelta * scaleFactor
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