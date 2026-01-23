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
  lastSwipeDirection: null
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
        intent: { accepted: false, lockAxis: false }
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
      descriptor = { type: 'press', element: target.element }
    }

    return {
      reactions: descriptor || null,
      intent: { accepted: !!descriptor, lockAxis: false }
    }
  },

  onSwipeStart(intent) {
    const { x, y, proposedAxis } = intent
    log('resolver', '[onSwipeStart] intent:', intent, 'lifecycle:', lifecycle)
    if (!lifecycle.pressActive || !lifecycle.currentTarget) {
      return { reactions: null, intent: { accepted: false, lockAxis: false } }
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
      descriptor = null // no extra reactions on swipeStart for now
    } else {
      // Try to find another lane under the pointer that supports this axis
      const newTarget = domRegistry.findLaneByAxis(x, y, proposedAxis)
      if (newTarget) {
        setCurrent(newTarget, lifecycle)
        lifecycle.pressedTarget = null
        lifecycle.swipeActive = true
        accepted = true
        lockAxis = newTarget.swipeType !== 'drag'
        descriptor = null
      }
    }
    return {
      reactions: descriptor, // null if nothing to forward
      intent: { accepted, lockAxis }
    }
  },

  onSwipe(intent) {
    if (!lifecycle.swipeActive || !supports('swipe', lifecycle)) return null

    const axis = resolveAxis(intent, lifecycle.currentTarget.axis)
    const dragKey = resolveDragKey(intent, lifecycle)
    return {
      type: 'swipe',
      element: lifecycle.currentTarget.element,
      payload: buildSwipePayload(intent, axis, dragKey)
    }
  },

  onSwipeEnd() {
    if (!lifecycle.swipeActive) return null

    const type = supports('swipeCommit', lifecycle)
      ? 'swipeCommit'
      : 'swipeRevert'

    const descriptor = { type, element: lifecycle.currentTarget?.element }
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
        ? { type: 'pressRelease', element: lifecycle.currentTarget?.element }
        : null,
      emitDeselect(lifecycle)
    )

    resetLifecycle(lifecycle)
    return descriptor
  }
}