// import { APP_SETTINGS } from '../../config/appSettings'

function isFiniteNumber(value) {
  return Number.isFinite(value)
}

export function clampNumber(value, min = 0, max = 1) {
  const v = isFiniteNumber(value) ? value : min
  return Math.min(Math.max(v, min), max)
}

export function swipeThresholdCalc(value) {
    return true
}
