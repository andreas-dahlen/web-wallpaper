import { normalizeSwipeDelta } from '../../state/sizeState'

function isDragType(swipeType) {
  return swipeType === 'drag'
}

function isSliderType(swipeType) {
  return swipeType === 'slider'
}

function computeDelta(payload, swipeType) {
  if (isDragType(swipeType)) {
    return payload.rawDelta || payload.delta || { x: 0, y: 0 }
  }
  return normalizeSwipeDelta(payload.delta)
}

export function computeSwipeDelta({ payload, target }) {
  return computeDelta(payload, target?.swipeType)
}

export function computeCommitDelta({ payload, target }) {
  return computeDelta(payload, target?.swipeType)
}

export function swipeAlwaysAllowed(target) {
  const swipeType = target?.swipeType
  return isDragType(swipeType) || isSliderType(swipeType)
}
