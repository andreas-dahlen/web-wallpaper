import { normalizeAxis } from './clampMath'

export function toNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

export function sanitizeScale(value) {
  const num = toNumber(value, 1)
  return num > 0 ? num : 1
}

export function scalePoint(point = {}, scale = 1) {
  const divisor = sanitizeScale(scale)
  return {
    x: toNumber(point.x) / divisor,
    y: toNumber(point.y) / divisor
  }
}

export function resolveDirection(axis, delta) {
  const ax = normalizeAxis(axis)
  const value = toNumber(delta, 0)
  if (value === 0) return null
  if (ax === 'y') return value > 0 ? 'down' : 'up'
  return value > 0 ? 'right' : 'left'
}

export function extractAxisDelta(totalDelta = {}, axis = 'x') {
  const ax = normalizeAxis(axis)
  return ax === 'y'
    ? toNumber(totalDelta.y)
    : toNumber(totalDelta.x)
}

export function buildRawPosition(start = {}, totalDelta = {}) {
  return {
    x: toNumber(start.x) + toNumber(totalDelta.x),
    y: toNumber(start.y) + toNumber(totalDelta.y)
  }
}

export { normalizeAxis }
