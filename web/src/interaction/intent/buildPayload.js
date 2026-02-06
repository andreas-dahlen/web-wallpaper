//buildPayload.js
import { state } from "../state/stateManager"

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
  // 2. Primary reaction
  reactions.push({
    type: result.type ?? null,
    element: current.element ?? null,
    delta: result?.delta ?? null,
    axis: result?.axis ?? null,
    laneId: current.laneId ?? null,
    swipeType: current.swipeType ?? null,
    laneSize: state.getSize(current.swipeType, current.laneId) ?? null,
    min: state.getMin(current.swipeType, current.laneId) ?? null,
    max: state.getMax(current.swipeType, current.laneId) ?? null
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