//buildPayload.js

import { getLaneSize } from "../state/carouselState"

export function buildPayload(result) {
  const payload = {
    reactions: buildReactions(result),
    control: buildControl(result)
  }
  return payload
}

function buildReactions(result) {
  const reactions = []

  const current = result?.target ?? null

  if (!current) return reactions // no target, nothing to do

  // 1. Derived side-effect: pressCancel
  if (result?.pressCancel) {
    reactions.push({
      type: 'pressCancel',
      element: result.pressCancel.element,
      delta: result.delta ?? null
    })
  }
  console.log(result.target.laneId)
  // 2. Primary reaction
  reactions.push({
    type: result.type ?? null,
    element: current.element ?? null,
    delta: result?.delta ?? null,
    axis: result?.axis ?? null,
    laneId: current.laneId ?? null,
    swipeType: current.swipeType ?? null,
    laneSize: getLaneSize(current.laneId) ?? null
  })

  return reactions
}

function buildControl(result) {
  const current = result?.target
  if (!current) return null

  if (result.type === 'swipeStart') {
    return { acceptedGesture: true }
  }
  return null
}