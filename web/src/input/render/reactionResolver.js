// reactionResolver.js
import {
  emitSelect,
  emitDeselect,
  mergeDescriptors,
  normalizeTarget,
  setCurrent,
  supports,
  resolveAxis,
  resolveDragKey,
  buildSwipePayload,
  resetLifecycle
} from './reactionHelper'
import { domRegistry } from '../dom/domRegistry'
import { log } from '../../debug/functions'

/* ------------------------------------------------------------------ */
/* constants                                                          */
/* ------------------------------------------------------------------ */
export const EMPTY_TARGET = {
  element: null,
  laneId: null,
  swipeType: null,
  axis: 'both',
  reactions: {}
}

/* ------------------------------------------------------------------ */
/* lifecycle (single source of truth)                                  */
/* ------------------------------------------------------------------ */
const lifecycle = {
  currentTarget: null,
  pressActive: false,
  swipeActive: false,
  pressedTarget: null,
  selectedElement: null,
  lastSwipeDirection: null,
  swipeAxis: 'both',
  dragKey: null
}

/* ------------------------------------------------------------------ */
/* resolver                                                           */
/* ------------------------------------------------------------------ */
export const reactionResolver = {
  onPress(intent) {
    const { x, y } = intent
    const found = domRegistry.findIntentAt(x, y)
    if (!found) {
      return {
        reactions: null,
        feedback: { accepted: false, lockAxis: false }
      }
    }
    const target = normalizeTarget(found)
    lifecycle.pressActive = true
    lifecycle.pressedTarget = target
    setCurrent(target, lifecycle)
    
    log('resolver', '[onPress] intent:', intent, 'lifecycle:', lifecycle)
    let descriptor = null
    if (supports('select', lifecycle)) {
      descriptor = emitSelect(target, lifecycle)
    } else if (supports('press', lifecycle)) {
      descriptor = {
        type: 'press',
        element: target.element,
        laneId: target.laneId,
        axis: target.axis,
        swipeType: target.swipeType,
        actionId: target.actionId
      }
    }

    return {
      reactions: descriptor || null,
      feedback: { accepted: !!descriptor, lockAxis: false }
    }
  },

  onSwipeStart(intent) {
    const { x, y, proposedAxis } = intent
    log('resolver', '[onSwipeStart] intent:', intent, 'lifecycle:', lifecycle)
    if (!lifecycle.pressActive || !lifecycle.currentTarget) {
      return { reactions: null, feedback: { accepted: false, lockAxis: false } }
    }

    const current = lifecycle.currentTarget
    let accepted = false
    let lockAxis = false
    let descriptor = null

    // Check if current target supports this swipe axis
    if (domRegistry.swipeAllowedForType(current, proposedAxis)) {
      lifecycle.swipeActive = true
      accepted = true
      lockAxis = current.swipeType !== 'drag'
    } else {
      // Try to find another lane under the pointer that supports this axis
      const newTarget = domRegistry.findLaneByAxis(x, y, proposedAxis)
      if (newTarget) {
        setCurrent(newTarget, lifecycle)
        lifecycle.pressedTarget = null
        lifecycle.swipeActive = true
        accepted = true
        lockAxis = newTarget.swipeType !== 'drag'
      }
    }

    if (accepted) {
      const axis = resolveAxis({ axis: proposedAxis }, lifecycle.currentTarget.axis)
      lifecycle.swipeAxis = axis
      lifecycle.dragKey = resolveDragKey(intent, lifecycle)
      descriptor = {
        type: 'swipeStart',
        element: lifecycle.currentTarget.element,
        laneId: lifecycle.currentTarget.laneId,
        swipeType: lifecycle.currentTarget.swipeType,
        axis,
        dragKey: lifecycle.dragKey
      }
    }

    return {
      reactions: descriptor, // null if nothing to forward
      feedback: { accepted, lockAxis }
    }
  },

  onSwipe(intent) {
    if (!lifecycle.swipeActive || !supports('swipe', lifecycle)) return null

    const axis = lifecycle.swipeAxis || resolveAxis(intent, lifecycle.currentTarget.axis)
    lifecycle.swipeAxis = axis

    const dragKey = lifecycle.dragKey || resolveDragKey(intent, lifecycle)
    lifecycle.dragKey = dragKey

    const payload = buildSwipePayload(intent, axis, dragKey)
    lifecycle.lastSwipeDirection = payload.direction || lifecycle.lastSwipeDirection

    return {
      type: 'swipe',
      element: lifecycle.currentTarget.element,
      laneId: lifecycle.currentTarget.laneId,
      swipeType: lifecycle.currentTarget.swipeType,
      axis: payload.axis,
      direction: payload.direction,
      delta: payload.delta,
      dragKey
    }
  },

  onSwipeEnd(intent = {}) {
    if (!lifecycle.swipeActive) return null

    const type = supports('swipeCommit', lifecycle)
      ? 'swipeCommit'
      : 'swipeRevert'

    const payload = buildSwipePayload(intent, lifecycle.swipeAxis, lifecycle.dragKey)
    const descriptor = {
      type,
      element: lifecycle.currentTarget?.element || null,
      laneId: lifecycle.currentTarget?.laneId || null,
      swipeType: lifecycle.currentTarget?.swipeType || null,
      axis: lifecycle.swipeAxis,
      direction: payload.direction || lifecycle.lastSwipeDirection,
      delta: payload.delta,
      dragKey: lifecycle.dragKey
    }

    resetLifecycle(lifecycle)
    return descriptor
  },

  onPressRelease() {
    if (!lifecycle.pressActive || lifecycle.swipeActive) {
      resetLifecycle(lifecycle)
      return null
    }

    const descriptor = mergeDescriptors(
      supports('pressRelease', lifecycle)
        ? {
            type: 'pressRelease',
            element: lifecycle.currentTarget?.element,
            laneId: lifecycle.currentTarget?.laneId,
            axis: lifecycle.currentTarget?.axis,
            swipeType: lifecycle.currentTarget?.swipeType,
            actionId: lifecycle.currentTarget?.actionId
          }
        : null,
      emitDeselect(lifecycle)
    )

    resetLifecycle(lifecycle)
    return descriptor
  }
}