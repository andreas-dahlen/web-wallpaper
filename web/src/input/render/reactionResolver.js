/**
 * reactionResolver.js - Intent → reaction descriptors
 *
 * Responsibilities:
 * - Resolve intents via domRegistry
 * - Coordinate gesture lifecycle and selection
 * - Assemble plain reaction descriptors (no DOM/state mutation)
 */
import { getAxisSize } from '../../state/sizeState'
import { domRegistry } from '../dom/domRegistry'
import { log } from '../../debug/functions'
import {
  getLane,
  shouldStartSwipeLane,
  shouldStartSwipeBySize,
  shouldCommitSwipeLane,
  shouldCommitSwipeBySize
} from '../../state/carouselState'
import {
  getDragBase,
  resetGestureTracking,
  attachDragRawDelta,
  beginGestureTracking
} from '../../state/gestureState'
import {
  computeSwipeDelta,
  computeCommitDelta,
} from './reactionSwipe'

let currentTarget = {
  element: null,
  laneId: null,
  laneAxis: null,
  actionId: null,
  swipeType: null,
  reactions: {}
}

let pressActive = false
let swipeActive = false
let pressedTarget = null
let selectedElement = null

function buildSwipeBase(target) {
  const { laneId, swipeType } = target

  if (swipeType === 'drag') {
    return {
      drag: {
        [laneId]: getDragBase(laneId)
      }
    }
  }

  const lane = getLane(laneId)
  if (!lane) return null

  return {
    axis: {
      [laneId]: lane.offset
    },
    size: {
      [laneId]: lane.size
    }
  }
}

// Always return either a single descriptor or a flat array (never nested).
function mergeDescriptors(existing, extra) {
  if (!existing && !extra) return null
  const list = []
  const push = (value) => {
    if (!value) return
    if (Array.isArray(value)) {
      list.push(...value)
    } else {
      list.push(value)
    }
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

function normalize(target) {
  if (!target) {
    return {
      element: null,
      laneId: null,
      laneAxis: null,
      actionId: null,
      swipeType: null,
      reactions: {}
    }
  }
  const reactions = target.reactions || {}
  const canonicalReactions = {
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
  return {
    ...target,
    laneAxis: target.laneAxis ?? target.direction ?? null,
    swipeType: target.swipeType ?? null,
    reactions: canonicalReactions
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
  currentTarget = normalize(target)
}

function supports(type) {
  return !!currentTarget.reactions?.[type]
}

export const reactionResolver = {
  onPress(x, y) {
    resetGestureTracking()
    const intent = domRegistry.findIntentAt(x, y)
    if (!intent) {
      setCurrent(null)
      pressedTarget = null
      pressActive = false
      swipeActive = false
      return emitDeselect()
    }
    setCurrent(intent)
    pressActive = supports('press')
    swipeActive = false
    pressedTarget = pressActive ? currentTarget : null

    if (supports('press')) {
      const pressDescriptor = {
        type: 'press',
        actionId: intent.actionId || null,
        laneId: intent.laneId || null,
        element: intent.element
      }
      const selectDescriptor = emitSelect(intent)
      return mergeDescriptors(pressDescriptor, selectDescriptor)
    }
    log('dom', intent)
    return emitDeselect()
  },

  onSwipeStart(x, y, axis) {
    const hit = domRegistry.findIntentAt(x, y)
    const deselect = hit?.element === selectedElement ? null : emitDeselect()
    const reactions = []

    let target = currentTarget

    // If current target cannot swipe, try to acquire a lane
    if (!supports('swipeStart')) {
      const lane = domRegistry.findLaneByAxis(x, y, axis)
      if (!lane) {
        // Cancel press if we were pressing something
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

        return reactions.length ? reactions[0] : null
      }

      target = withLaneReactions({
        element: lane.element,
        laneId: lane.laneId,
        laneAxis: lane.direction,
        swipeType: lane.swipeType,
        actionId: null
      })

      setCurrent(target)
    }

    if (!supports('swipeStart')) return null

    // Cancel press when swipe begins
    if (pressActive && pressedTarget?.element) {
      reactions.push({
        type: 'pressCancel',
        laneId: pressedTarget.laneId,
        element: pressedTarget.element
      })
      pressActive = false
      pressedTarget = null
    }

    reactions.push({
      type: 'swipeStart',
      laneId: currentTarget.laneId,
      axis,
      element: currentTarget.element,
      swipeType: currentTarget.swipeType,
      direction: currentTarget.laneAxis,
      raw: { x, y }
    })

    swipeActive = true
    beginGestureTracking(x, y, currentTarget.swipeType)

    return mergeDescriptors(
      reactions.length === 1 ? reactions[0] : reactions,
      deselect
    )
  },

  onSwipe(intent) {
    const hit = domRegistry.findIntentAt(intent.x, intent.y)
    const deselect = hit?.element === selectedElement ? null : emitDeselect()

    const payload = attachDragRawDelta(intent)

    if (!swipeActive || !currentTarget.laneId) return deselect
    if (!supports('swipe')) return deselect

    const base = buildSwipeBase(currentTarget)
    if (!base) return deselect

    const deltaResult = computeSwipeDelta({
      payload,
      target: currentTarget,
      base
    })

    if (!deltaResult) return deselect

    const swipeDescriptor = {
      type: 'swipe',
      laneId: currentTarget.laneId,
      axis: payload.axis,
      element: currentTarget.element,
      swipeType: currentTarget.swipeType,
      direction: currentTarget.laneAxis,
      ...(typeof deltaResult === 'object'
        ? deltaResult
        : { delta: deltaResult }),
      ...(currentTarget.swipeType === 'drag'
        ? { raw: payload.raw || { x: payload.x, y: payload.y } }
        : null)
    }

    return mergeDescriptors(swipeDescriptor, deselect)
  },
  onSwipeCommit(intent) {
    const payload = attachDragRawDelta(intent)

    if (!swipeActive || !currentTarget.laneId) {
      resetGestureTracking()
      return null
    }
    if (!supports('swipeCommit')) {
      resetGestureTracking()
      return null
    }

    const base = buildSwipeBase(currentTarget)
    if (!base) {
      resetGestureTracking()
      return null
    }

    const deltaResult = computeCommitDelta({
      payload,
      target: currentTarget,
      base
    })

    const descriptor = {
      type: 'swipeCommit',
      laneId: currentTarget.laneId,
      axis: payload.axis,
      direction: payload.direction,
      element: currentTarget.element,
      swipeType: currentTarget.swipeType,
      laneDirection: currentTarget.laneAxis,
      ...(typeof deltaResult === 'object'
        ? deltaResult
        : { delta: deltaResult })
    }

    pressActive = false
    swipeActive = false
    pressedTarget = null
    setCurrent(null)
    resetGestureTracking()

    return mergeDescriptors(descriptor, emitDeselect())
  },
  onSwipeRevert() {
    if (!swipeActive || !currentTarget.element) {
      pressActive = false
      swipeActive = false
      setCurrent(null)
      resetGestureTracking()
      return emitDeselect()
    }
    const descriptor = {
      type: 'swipeRevert',
      laneId: currentTarget.laneId,
      element: currentTarget.element,
      swipeType: currentTarget.swipeType,
      laneDirection: currentTarget.laneAxis
    }
    pressActive = false
    swipeActive = false
    pressedTarget = null
    setCurrent(null)
    resetGestureTracking()
    return mergeDescriptors(descriptor, emitDeselect())
  },

  onPressRelease(intent) {
    const target = pressedTarget
    const hit = domRegistry.findIntentAt(intent.x, intent.y)
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

    pressActive = false
    swipeActive = false
    pressedTarget = null
    setCurrent(null)
    resetGestureTracking()
    return mergeDescriptors(descriptor, emitDeselect())
  },

  shouldStartSwipe(delta, axis) {
    if (currentTarget.swipeType === 'drag') return true
    if (currentTarget.swipeType === 'slider') {
      return currentTarget.laneId != null
    }

    if (currentTarget.laneId && shouldStartSwipeLane(currentTarget.laneId, delta)) {
      return true
    }

    const size = getAxisSize(axis)
    return shouldStartSwipeBySize(size, delta)
  },

  shouldCommitSwipe(delta, axis) {
    if (currentTarget.swipeType !== 'carousel') return false

    if (currentTarget.laneId && shouldCommitSwipeLane(currentTarget.laneId, delta)) {
      return true
    }

    const size = getAxisSize(axis)
    return shouldCommitSwipeBySize(size, delta)
  },

  shouldRevertSwipe() {
    return currentTarget?.swipeType === 'carousel'
  }
}