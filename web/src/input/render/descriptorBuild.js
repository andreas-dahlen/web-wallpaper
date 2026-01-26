export const descriptorBuilder = {
  buildPress(intent, target) {
    return { type: 'press', 
        element: target.element, 
        action: target.action,
        delta: intent.delta 
    }
  },
  buildPressRelease(intent, target) {
    return { type: 'pressRelease', 
        element: target.element, 
        action: target.action,
        delta: intent.delta 
    }
  },
  buildSwipeStart(intent, target, previousTarget) {
    return { type: 'swipeStart',
        element: target.element, 
        laneId: target.laneId,
        previousElement: previousTarget?.element ?? null,
        delta: intent.delta 
    }
  },
  buildSwipeType(type, intent, target) {
    return {
      type,
      swipeType: target.swipeType,
      element: target.element,
      delta: intent.delta,
      direction: intent.axis,
      laneId: target.laneId
    }
  }
}

/* ------------------------------------------------------------------ */
/* utils                                                              */
/* ------------------------------------------------------------------ */

function mergeDescriptors(existing, extra) {
  if (!existing && !extra) return null
  const list = []

  const push = (value) => {
    if (!value) return
    if (Array.isArray(value)) list.push(...value)
    else list.push(value)
  }

  push(existing)
  push(extra)

  if (!list.length) return null
  return list.length === 1 ? list[0] : list
}

/* ------------------------------------------------------------------ */
/* selection                                                          */
/* ------------------------------------------------------------------ */

export function emitSelect(target, lifecycle) {
  if (!target?.element) return null
  if (lifecycle.selectedElement === target.element) return null

  const deselect = emitDeselect(lifecycle)
  lifecycle.selectedElement = target.element

  return mergeDescriptors(deselect, {
    type: 'select',
    element: target.element
  })
}

export function emitDeselect(lifecycle) {
  if (!lifecycle.selectedElement) return null

  const descriptor = {
    type: 'deselect',
    element: lifecycle.selectedElement
  }

  lifecycle.selectedElement = null
  return descriptor
}

/* ------------------------------------------------------------------ */
/* target normalization                                               */
/* ------------------------------------------------------------------ */

export function normalizeTarget(target) {
  if (!target) return null
  
  return {
    element: target.element ?? null,
    laneId: target.laneId ?? null,
    swipeType: target.swipeType ?? null,
    actionId: target.actionId ?? null,
    axis: target.axis ?? 'both',
    reactions: normalizeReactions(target.reactions)
  }
}

export function buildSwipeBase(target, dragKey) {
  const { laneId, swipeType } = target
  if (!laneId) return null

  switch (swipeType) {
    case 'drag':
      return {
        drag: {
          [dragKey]: getDragPosition(dragKey) ?? { x: 0, y: 0 }
        }
      }

    case 'slider':
    case 'carousel': {
      const snap = getSwipeBase(laneId)
      if (!snap) return null

      return {
        axis: {
          [laneId]:
            swipeType === 'carousel'
              ? snap.committedOffset
              : snap.offset
        },
        size: {
          [laneId]: snap.size
        },
        committedOffset:
          swipeType === 'carousel'
            ? { [laneId]: snap.committedOffset }
            : undefined
      }
    }

    default:
      return null
  }
}

function normalizeDeltaForAxis(deltaInput = {}, axis) {
  const normalizedAxis = normalizeAxis(axis, 'both')

  // Axis locked: return a single numeric delta for the locked dimension
  if (normalizedAxis === 'horizontal') {
    return toNumber(deltaInput.x ?? deltaInput, 0)
  }

  if (normalizedAxis === 'vertical') {
    return toNumber(deltaInput.y ?? deltaInput, 0)
  }

  // Axis is free: ensure a 2D delta object
  return {
    x: toNumber(deltaInput.x ?? 0, 0),
    y: toNumber(deltaInput.y ?? 0, 0)
  }
}

function resolveDirectionFromDelta(delta, axis) {
  const normalizedAxis = normalizeAxis(axis, 'both')

  if (typeof delta === 'number') {
    if (delta === 0) return null
    if (normalizedAxis === 'vertical') return delta > 0 ? 'down' : 'up'
    return delta > 0 ? 'right' : 'left'
  }

  const dx = toNumber(delta?.x, 0)
  const dy = toNumber(delta?.y, 0)
  const absX = Math.abs(dx)
  const absY = Math.abs(dy)
  if (absX === 0 && absY === 0) return null

  if (absX >= absY) {
    return dx > 0 ? 'right' : 'left'
  }
  return dy > 0 ? 'down' : 'up'
}

export function buildSwipePayload(intent, axisKey, dragKey) {
  const deltaInput = intent?.delta ?? {}
  const axis = normalizeAxis(axisKey, 'both')
  const delta = normalizeDeltaForAxis(deltaInput, axis)
  const direction = resolveDirectionFromDelta(delta, axis)

  return {
    axis,
    delta,
    dragKey,
    direction
  }
}

const REACTION_KEYS = [
  'press',
  'pressRelease',
  'pressCancel',
  'swipeStart',
  'swipe',
  'swipeCommit',
  'swipeRevert',
  'select',
  'deselect'
]

export function normalizeReactions(reactions = {}) {
  const normalized = {}
  for (const key of REACTION_KEYS) {
    normalized[key] = !!reactions[key]
  }
  return normalized
}
