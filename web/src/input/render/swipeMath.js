import { clampValue } from '../../state/swipeState'

function fallbackBounds(bounds) {
  if (!bounds) return { width: 0, height: 0 }
  return {
    width: Number.isFinite(bounds.width) ? bounds.width : 0,
    height: Number.isFinite(bounds.height) ? bounds.height : 0
  }
}

export function getSwipeBases(lane, swipeType) {
  const baseAxis = swipeType === 'slider'
    ? lane?.committedOffset || 0
    : 0

  const basePoint = swipeType === 'drag'
    ? (lane?.dragPosition || { x: 0, y: 0 })
    : { x: 0, y: 0 }

  return { baseAxis, basePoint }
}

export function clampAxisDelta({
  delta = 0,
  lane,
  swipeType,
  axisSize,
  baseAxis = 0
}) {
  const size = Number.isFinite(lane?.size) && lane?.size !== 0
    ? lane.size
    : (axisSize || 0)

  if (!size) return delta

  const min = swipeType === 'slider' ? 0 : -size
  const max = size
  const next = baseAxis + delta
  const clamped = clampValue(next, min, max)
  return clamped - baseAxis
}

export function clampDragDelta({ delta = { x: 0, y: 0 }, lane, basePoint = { x: 0, y: 0 } }) {
  const bounds = fallbackBounds(lane?.bounds)
  if (!bounds.width && !bounds.height) {
    return { x: delta.x || 0, y: delta.y || 0 }
  }

  const nextX = clampValue(basePoint.x + (delta.x || 0), 0, bounds.width)
  const nextY = clampValue(basePoint.y + (delta.y || 0), 0, bounds.height)

  return {
    x: nextX - basePoint.x,
    y: nextY - basePoint.y
  }
}

export function deriveAbsolute(basePoint = { x: 0, y: 0 }, delta = { x: 0, y: 0 }) {
  return {
    x: basePoint.x + (delta.x || 0),
    y: basePoint.y + (delta.y || 0)
  }
}

export function measureLaneMetrics(element, axis) {
  if (!element?.getBoundingClientRect) {
    return {
      size: 0,
      bounds: { width: 0, height: 0 },
      count: null,
      direction: axis || null
    }
  }
  const rect = element.getBoundingClientRect()
  const direction = axis || element.dataset?.direction || null
  const size = direction === 'vertical' ? rect.height : rect.width
  const laneCountRaw = element.dataset?.laneCount
  const count = laneCountRaw !== undefined ? Number(laneCountRaw) : null

  return {
    size,
    bounds: { width: rect.width, height: rect.height },
    count: Number.isFinite(count) ? count : null,
    direction
  }
}
