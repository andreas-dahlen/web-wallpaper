import { APP_SETTINGS } from '../../config/appSettings'

function isFiniteNumber(value) {
  return Number.isFinite(value)
}

export function clampNumber(value, min = 0, max = 1) {
  const v = isFiniteNumber(value) ? value : min
  return Math.min(Math.max(v, min), max)
}

function clamp01(value) {
  return clampNumber(value, 0, 1)
}

export function normalizeAxis(axis, fallback = 'both') {
  if (axis === 'vertical' || axis === 'y') return 'vertical'
  if (axis === 'horizontal' || axis === 'x') return 'horizontal'
  return fallback
}

function clampDeltaAgainstBounds(base, delta, min, max) {
  const absolute = base + delta
  const clampedAbsolute = clampNumber(absolute, min, max)
  return {
    clampedDelta: clampedAbsolute - base,
    clampedAbsolute
  }
}

function resolveBoundSize(...candidates) {
  for (const candidate of candidates) {
    if (isFiniteNumber(candidate) && candidate > 0) return candidate
  }
  return undefined
}

export function clampSwipe({ type, axis, delta, base, parentSize, size, axisSize }) {
  const ax = normalizeAxis(axis)
  const baseValue = isFiniteNumber(base) ? base : 0
  const deltaValue = isFiniteNumber(delta) ? delta : 0

  if (!isFiniteNumber(baseValue) || !isFiniteNumber(deltaValue)) {
    return { clampedDelta: 0 }
  }

  if (type === 'swipeCarousel') {
    const max = resolveBoundSize(size, parentSize, axisSize, Infinity)
    if (!isFiniteNumber(max)) {
      return { clampedDelta: 0 }
    }
    const { clampedDelta } = clampDeltaAgainstBounds(baseValue, deltaValue, -Infinity, max)
    return { clampedDelta }
  }

  if (type === 'swipeSlider') {
    const boundSize = resolveBoundSize(size, parentSize, axisSize)
    if (!isFiniteNumber(boundSize) || boundSize <= 0) {
      return { clampedDelta: 0, normalized: 0, normalizedPercent: 0 }
    }

    const { clampedDelta, clampedAbsolute } = clampDeltaAgainstBounds(
      baseValue,
      deltaValue,
      0,
      boundSize
    )

    const normalized = clamp01(clampedAbsolute / boundSize)
    return { clampedDelta, normalized, normalizedPercent: normalized * 100 }
  }

  if (type === 'swipeDrag') {
    const boundSize = resolveBoundSize(parentSize, axisSize)
    if (!isFiniteNumber(boundSize) || boundSize <= 0) {
      return { clampedDelta: 0 }
    }
    const { clampedDelta } = clampDeltaAgainstBounds(baseValue, deltaValue, 0, boundSize)
    return { clampedDelta }
  }

  return { clampedDelta: deltaValue }
}

export function clampDelta2D({ type, delta, base, parent }) {
  const resultX = clampSwipe({
    type,
    axis: 'x',
    delta: delta?.x,
    base: base?.x,
    parentSize: parent?.width
  })
  const resultY = clampSwipe({
    type,
    axis: 'y',
    delta: delta?.y,
    base: base?.y,
    parentSize: parent?.height
  })

  const clamped = { x: resultX.clampedDelta, y: resultY.clampedDelta }
  const normalized =
    type === 'swipeSlider'
      ? { x: resultX.normalized ?? 0, y: resultY.normalized ?? 0 }
      : undefined

  return { clamped, normalized }
}

export function swipeThresholdCalc(value) {
    return true
}

export function shouldStartSwipeBySize(size, delta, ratio = APP_SETTINGS.swipeThresholdRatio) {
  if (!isFiniteNumber(size) || size <= 0) return false
  return Math.abs(delta ?? 0) >= size * ratio
}

export function shouldCommitSwipeBySize(size, delta, ratio = APP_SETTINGS.swipeCommitRatio) {
  if (!isFiniteNumber(size) || size <= 0) return false
  return Math.abs(delta ?? 0) >= size * ratio
}
