import { APP_SETTINGS } from '../../config/appSettings'
import { getAxisSize, scale } from '../../state/sizeState'
import { domRegistry } from '../dom/domRegistry'
// import { log } from '../../debug/functions'
import { getLane } from '../../state/carouselState'
import {
  resetGestureTracking,
  beginGestureTracking,
  snapshotSwipeBase,
  getSwipeBase,
  clearSwipeBase,
  getDragPosition,
  getGestureStart
} from '../../state/gestureState'
import {
  computeSwipeDelta,
  computeCommitDelta,
  shouldStartSwipeBySize,
  shouldCommitSwipeBySize
} from './reactionSwipe'
import { buildDragRaw } from '../math/swipeDelta'
import { extractAxisDelta, normalizeAxis, resolveDirection, toNumber } from '../math/swipeMath'

const EMPTY_TARGET = {
  element: null,
  laneId: null,
  laneAxis: null,
  actionId: null,
  swipeType: null,
  reactions: {}
}

let currentTarget = { ...EMPTY_TARGET }
let pressActive = false
let swipeActive = false
let pressedTarget = null
let selectedElement = null
let lastSwipeDirection = null

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

function emitSelect(target) {
  if (!target?.element || selectedElement === target.element) return null
  const deselect = emitDeselect()
  selectedElement = target.element
  return mergeDescriptors(deselect, { type: 'select', element: target.element })
}

function emitDeselect() {
  if (!selectedElement) return null
  const descriptor = { type: 'deselect', element: selectedElement }
  selectedElement = null
  return descriptor
}

function normalizeTarget(target) {
  if (!target) return { ...EMPTY_TARGET }
  const reactions = target.reactions || {}
  return {
    ...target,
    laneAxis: target.laneAxis ?? target.direction ?? null,
    swipeType: target.swipeType ?? null,
    reactions: {
      press: !!reactions.press,
      pressRelease: !!reactions.pressRelease,
      pressCancel: !!reactions.pressCancel,
      swipeStart: !!reactions.swipeStart,
      swipe: !!reactions.swipe,
      swipeCommit: !!reactions.swipeCommit,
      swipeRevert: !!reactions.swipeRevert,
      select: !!reactions.select,
      deselect: !!reactions.deselect
    }
  }
}

function withLaneReactions(target) {
  return {
    ...target,
    reactions: {
      ...target.reactions,
      swipeStart: true,
      swipe: true,
      swipeCommit: true,
      pressCancel: true
    }
  }
}

function setCurrent(target) {
  currentTarget = normalizeTarget(target)
}

function supports(type) {
  return !!currentTarget.reactions?.[type]
}

function resolveAxis(intent, fallback) {
  const rawAxis = intent?.axis || intent?.lockedAxis || intent?.mode || fallback
  return normalizeAxis(rawAxis || 'x')
}

function resolveDragKey(intent) {
  return intent?.dragId || currentTarget.laneId || 'default'
}

function parentSizes() {
  return { width: getAxisSize('x'), height: getAxisSize('y') }
}

function buildSwipeBase(target, dragKey) {
  const { laneId, swipeType } = target
  if (!laneId) return null

  switch (swipeType) {
    case 'drag':
      return {
        drag: {
          [dragKey]: getDragPosition(dragKey) // last-known absolute position
        }
      }

    case 'slider':
    case 'carousel': {
      const lane = getLane(laneId)
      if (!lane) return null

      const snap = getSwipeBase(laneId) || {
        offset: lane.offset ?? 0,
        committedOffset: lane.committedOffset ?? lane.offset ?? 0,
        size: lane.size ?? 0
      }

      return {
        axis: {
          [laneId]: swipeType === 'carousel' ? snap.committedOffset : snap.offset
        },
        size: {
          [laneId]: snap.size
        },
        committedOffset: swipeType === 'carousel'
          ? { [laneId]: snap.committedOffset }
          : undefined
      }
    }

    default:
      return null
  }
}

function buildSwipePayload(intent, axisKey, dragKey) {
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

function resetLifecycle() {
  pressActive = false
  swipeActive = false
  pressedTarget = null
  lastSwipeDirection = null
  setCurrent(null)
  resetGestureTracking()
}

function ensureLaneSize(targetBase, laneId, swipeType) {
  if (!laneId) return true
  if (swipeType === 'drag') return true
  const size = targetBase?.size?.[laneId]
  if (!size || !Number.isFinite(size)) return false
  return true
}

function returnSwipeResult(reactions, accepted, mode = null) {
  return {
    reactions: reactions ?? null,
    intent: accepted
      ? { accepted: true, mode }
      : { accepted: false }
  }
}

export const reactionResolver = {
  onPress(intent = {}) {
    resetGestureTracking()
    const x = toNumber(intent.x)
    const y = toNumber(intent.y)
    const resolved = domRegistry.findIntentAt(x, y)
    if (!resolved) {
      resetLifecycle()
      return emitDeselect()
    }

    setCurrent(resolved)
    pressActive = supports('press')
    swipeActive = false
    pressedTarget = pressActive ? currentTarget : null

    if (supports('press')) {
      const pressDescriptor = {
        type: 'press',
        actionId: resolved.actionId || null,
        laneId: resolved.laneId || null,
        element: resolved.element
      }
      const selectDescriptor = emitSelect(resolved)
      return mergeDescriptors(pressDescriptor, selectDescriptor)
    }

    return emitDeselect()
  },

  onSwipeStart(intent = {}) {
  const x = toNumber(intent.x)
  const y = toNumber(intent.y)
  const axisKey = resolveAxis(intent, currentTarget.laneAxis)
  const hit = domRegistry.findIntentAt(x, y)
  const deselect = hit?.element === selectedElement ? null : emitDeselect()
  const reactions = []

  let mode = null

  // Check if the current target can handle swipe in this axis
  const canSwipe = domRegistry.swipeAllowedForType(currentTarget, axisKey) && supports('swipeStart')

  if (!canSwipe) {
    // Try to find a new lane under the pointer
    const lane = domRegistry.findLaneForSwipe(x, y, axisKey)

    if (!lane) {
      // No lane → cancel any lingering press and reject swipe
      if (pressActive && pressedTarget?.element) {
        reactions.push({
          type: 'pressCancel',
          laneId: pressedTarget.laneId,
          element: pressedTarget.element
        })
      }

      pressActive = false
      pressedTarget = null
      swipeActive = false

      return returnSwipeResult(
        reactions.length ? mergeDescriptors(reactions, deselect) : deselect,
        false,
        null
      )
    }

    // Lane found → update current target
    setCurrent(
      withLaneReactions({
        element: lane.element,
        laneId: lane.laneId,
        laneAxis: lane.direction,
        swipeType: lane.swipeType,
        actionId: null
      })
    )
  }

  // Safety check: must have a valid target
  if (!currentTarget.laneId) {
    return returnSwipeResult(deselect, false, null)
  }

  // Cancel lingering press if needed
  if (pressActive && pressedTarget?.element) {
    reactions.push({
      type: 'pressCancel',
      laneId: pressedTarget.laneId,
      element: pressedTarget.element
    })
    pressActive = false
    pressedTarget = null
  }

  // Emit swipeStart descriptor
  reactions.push({
    type: 'swipeStart',
    laneId: currentTarget.laneId,
    axis: axisKey,
    element: currentTarget.element,
    swipeType: currentTarget.swipeType,
    laneDirection: currentTarget.laneAxis,
    raw: { x, y }
  })

  swipeActive = true
  lastSwipeDirection = null
  beginGestureTracking({ x, y, swipeType: currentTarget.swipeType })

  // Snapshot carousel/slider state if needed
  if (currentTarget.swipeType === 'slider' || currentTarget.swipeType === 'carousel') {
    const lane = getLane(currentTarget.laneId)
    snapshotSwipeBase(currentTarget.laneId, {
      offset: lane?.offset ?? 0,
      committedOffset: lane?.committedOffset ?? lane?.offset ?? 0,
      size: lane?.size ?? 0
    })
  }

  // Determine mode for intentEngine
  mode = currentTarget.swipeType === 'drag' ? 'both' : currentTarget.laneAxis

  const merged = mergeDescriptors(
    reactions.length === 1 ? reactions[0] : reactions,
    deselect
  )

  return returnSwipeResult(merged, true, mode)
},

  onSwipe(intent = {}) {
    const axisKey = resolveAxis(intent, currentTarget.laneAxis)
    const dragKey = resolveDragKey(intent)
    const payload = buildSwipePayload(intent, axisKey, dragKey)
    const hit = payload.raw ? domRegistry.findIntentAt(payload.raw.x, payload.raw.y) : null
    const deselect = hit?.element === selectedElement ? null : emitDeselect()
    const base = buildSwipeBase(currentTarget, dragKey)

    if (!swipeActive || !currentTarget.laneId) return deselect
    if (!supports('swipe')) return deselect
    if (!base || !ensureLaneSize(base, currentTarget.laneId, currentTarget.swipeType)) return deselect

    const deltaResult = computeSwipeDelta({
      payload,
      target: currentTarget,
      base,
      parent: parentSizes(),
      scale: scale.value
    })

    if (!deltaResult) return emitDeselect()

    const direction = deltaResult.direction || resolveDirection(axisKey, payload.delta) || lastSwipeDirection
    lastSwipeDirection = direction || lastSwipeDirection

    const descriptor = {
      type: 'swipe',
      laneId: currentTarget.laneId,
      axis: axisKey,
      element: currentTarget.element,
      swipeType: currentTarget.swipeType,
      laneDirection: currentTarget.laneAxis,
      direction,
      ...(currentTarget.swipeType === 'drag'
        ? { delta: deltaResult.delta, dragKey, absolute: deltaResult.absolute }
        : { delta: deltaResult.delta })
    }

    if (deltaResult.normalized !== undefined) {
      descriptor.normalized = deltaResult.normalized
      descriptor.normalizedPercent = deltaResult.normalizedPercent
    }

    return mergeDescriptors(descriptor, deselect)
  },

  onSwipeEnd(intent = {}) {
    if (!swipeActive || !currentTarget.laneId) {
      resetLifecycle()
      return null
    }
    if (!supports('swipeCommit')) {
      resetLifecycle()
      return null
    }

    const axisKey = resolveAxis(intent, currentTarget.laneAxis)
    const dragKey = resolveDragKey(intent)
    const payload = buildSwipePayload(intent, axisKey, dragKey)
    const base = buildSwipeBase(currentTarget, dragKey)

    if (!base || !ensureLaneSize(base, currentTarget.laneId, currentTarget.swipeType)) {
      resetLifecycle()
      clearSwipeBase(currentTarget.laneId)
      return null
    }

    const axisDelta = payload.delta
    const size = base.size?.[currentTarget.laneId] ?? getAxisSize(axisKey)
    const commitAllowed = currentTarget.swipeType === 'carousel'
      ? shouldCommitSwipeBySize(size, axisDelta, APP_SETTINGS.swipeCommitRatio)
      : true

    let descriptor = null

    if (currentTarget.swipeType === 'carousel' && !commitAllowed) {
      descriptor = {
        type: 'swipeRevert',
        laneId: currentTarget.laneId,
        element: currentTarget.element,
        swipeType: currentTarget.swipeType,
        laneDirection: currentTarget.laneAxis
      }
    } else {
      const deltaResult = computeCommitDelta({
        payload,
        target: currentTarget,
        base,
        parent: parentSizes(),
        scale: scale.value
      })

      if (!deltaResult) {
        resetLifecycle()
        clearSwipeBase(currentTarget.laneId)
        return null
      }

      const direction = deltaResult.direction || resolveDirection(axisKey, payload.delta) || lastSwipeDirection

      descriptor = {
        type: 'swipeCommit',
        laneId: currentTarget.laneId,
        axis: axisKey,
        direction,
        element: currentTarget.element,
        swipeType: currentTarget.swipeType,
        laneDirection: currentTarget.laneAxis,
        ...(currentTarget.swipeType === 'drag'
          ? { dragKey, absolute: deltaResult.absolute, delta: deltaResult.delta }
          : { delta: deltaResult.delta })
      }

      if (deltaResult.normalized !== undefined) {
        descriptor.normalized = deltaResult.normalized
        descriptor.normalizedPercent = deltaResult.normalizedPercent
      }
    }

    const laneId = currentTarget.laneId
    const result = mergeDescriptors(descriptor, emitDeselect())
    resetLifecycle()
    clearSwipeBase(laneId)
    return result
  },

  onPressRelease(intent = {}) {
    const x = toNumber(intent.x)
    const y = toNumber(intent.y)
    const target = pressedTarget
    const hit = domRegistry.findIntentAt(x, y)
    const sameElement = target && hit?.element === target.element

    let descriptor = null

    if (sameElement && target.reactions?.pressRelease) {
      descriptor = {
        type: 'pressRelease',
        actionId: target.actionId || null,
        laneId: target.laneId || null,
        element: target.element
      }
    } else if (target) {
      descriptor = {
        type: 'pressCancel',
        laneId: target.laneId,
        element: target.element
      }
    }

    resetLifecycle()
    return mergeDescriptors(descriptor, emitDeselect())
  },

  shouldStartSwipe(delta, axis) {
    if (!currentTarget.laneId) return false

    switch (currentTarget.swipeType) {
      case 'drag':
        return true
      case 'slider':
        return !!getLane(currentTarget.laneId)
      case 'carousel': {
        const size = getAxisSize(axis)
        return shouldStartSwipeBySize(size, delta, APP_SETTINGS.swipeThresholdRatio)
      }
      default:
        return false
    }
  },

  shouldCommitSwipe(delta, axis) {
    if (!currentTarget.laneId) return false

    switch (currentTarget.swipeType) {
      case 'drag':
      case 'slider':
        return true
      case 'carousel': {
        const size = getAxisSize(axis)
        return shouldCommitSwipeBySize(size, delta, APP_SETTINGS.swipeCommitRatio)
      }
      default:
        return false
    }
  },

  shouldRevertSwipe() {
    return currentTarget?.swipeType === 'carousel'
  }
}