// reactionHelper.js

import {
  getDragPosition,
  getGestureStart,
  getSwipeBase,
  resetGestureTracking
} from '../../state/gestureState'
import { extractAxisDelta, normalizeAxis } from '../math/swipeMath'
import { buildDragRaw } from '../math/swipeDelta'
import { getAxisSize } from '../../state/sizeState'

/* ------------------------------------------------------------------ */
/* utils                                                              */
/* ------------------------------------------------------------------ */

export function mergeDescriptors(existing, extra) {
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
/* reactions                                                       */
/* ------------------------------------------------------------------ */
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
    axis: target.axis ?? 'both',
    reactions: normalizeReactions(target.reactions)
  }
}

/* ------------------------------------------------------------------ */
/* lifecycle helpers                                                  */
/* ------------------------------------------------------------------ */

export function setCurrent(target, lifecycle) {
  lifecycle.currentTarget = normalizeTarget(target)
}

export function supports(type, lifecycle) {
  return !!lifecycle.currentTarget?.reactions?.[type]
}

export function resetLifecycle(lifecycle) {
  lifecycle.pressActive = false
  lifecycle.swipeActive = false
  lifecycle.pressedTarget = null
  lifecycle.lastSwipeDirection = null
  lifecycle.currentTarget = null

  resetGestureTracking()
}

/* ------------------------------------------------------------------ */
/* intent helpers                                                     */
/* ------------------------------------------------------------------ */

export function resolveAxis(intent, fallback = 'both') {
  const raw =
    intent?.axis ??
    intent?.lockedAxis ??
    intent?.mode ??
    fallback

  return normalizeAxis(raw)
}

export function resolveDragKey(intent, lifecycle) {
  return (
    intent?.dragId ??
    lifecycle.currentTarget?.laneId ??
    'default'
  )
}

export function parentSize() {
  return {
    width: getAxisSize('horizontal'),
    height: getAxisSize('vertical')
  }
}

/* ------------------------------------------------------------------ */
/* swipe construction                                                 */
/* ------------------------------------------------------------------ */

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

export function buildSwipePayload(intent, axisKey, dragKey) {
  const totalDelta = intent?.totalDelta || {}
  const start = getGestureStart()

  return {
    axis: axisKey,
    delta: extractAxisDelta(totalDelta, axisKey),
    rawDelta: totalDelta,
    raw: buildDragRaw({ start, totalDelta }),
    dragKey
  }
}

export function ensureLaneSize(targetBase, laneId, swipeType) {
  if (!laneId) return true
  if (swipeType === 'drag') return true

  const size = targetBase?.size?.[laneId]
  return Number.isFinite(size)
}




