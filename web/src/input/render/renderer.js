/**
 * renderer.js - Reaction coordinator (not animator)
 *
 * Receives reaction descriptors and applies:
 * - data-pressed / data-swiping for CSS hooks
 * - carouselState updates for lane carousels
 * - dispatches CustomEvent('reaction', { detail }) for Vue/app hooks
 */

import { ensureLane, applyLaneOffset, commitLaneSwipe } from '../../state/carouselState'
import {
  setDragPosition,
  clearDragBase
} from '../../state/gestureState'
import { log } from '../../debug/functions'

function setAttr(el, key, val) {
  if (!el) return
  if (val === false || val === null || val === undefined) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, String(val))
  }
}

function dispatchReaction(descriptor) {
  const target = descriptor.element || window

  target.dispatchEvent(new CustomEvent('reaction', { detail: descriptor }))
}

// ----------------- Press / Select -----------------
function handlePressDescriptor(descriptor) {
  const shouldSet = descriptor.type === 'press'
  setAttr(descriptor.element, 'data-pressed', shouldSet ? true : null)
  dispatchReaction(descriptor)
}

function handleSelectDescriptor(descriptor) {
  const shouldSet = descriptor.type === 'select'
  setAttr(descriptor.element, 'data-selected', shouldSet ? true : null)
  dispatchReaction(descriptor)
}

// ----------------- Swipe Start -----------------
function handleSwipeStart(descriptor) {
  if (descriptor.swipeType === 'drag') {
    setAttr(descriptor.element, 'data-swiping', true)
    dispatchReaction(descriptor)
    return
  }

  if (!descriptor.laneId) return
  const lane = ensureLane(descriptor.laneId)
  lane.dragging = true
  lane.pendingDir = null
  setAttr(descriptor.element, 'data-swiping', true)
  dispatchReaction(descriptor)
}

// ----------------- Swipe / Drag -----------------
function handleSwipe(descriptor) {
  const type = descriptor.swipeType

  // ---- DRAG (2D, no lane) ----
  if (type === 'drag') {
    const hasDeltaObject = descriptor.delta && typeof descriptor.delta === 'object'
    if (!descriptor.dragKey || !hasDeltaObject) {
      log('drag', 'Invalid drag frame', descriptor)
      return
    }
    dispatchReaction(descriptor)
    return
  }

  // ---- LANE-BASED (1D) ----
  if (!descriptor.laneId) return

  if (typeof descriptor.delta === 'number') {
    const lane = ensureLane(descriptor.laneId)
    if (type === 'slider') {
      const base = lane.committedOffset || 0
      lane.offset = base + descriptor.delta
    } else {
      applyLaneOffset(descriptor.laneId, descriptor.delta)
    }
    dispatchReaction(descriptor)
  }
}

// ----------------- Swipe Commit -----------------
function handleSwipeCommit(descriptor) {
  const type = descriptor.swipeType

  // ---- DRAG COMMIT ----
  if (type === 'drag') {
    const hasDeltaObject = descriptor.delta && typeof descriptor.delta === 'object'
    if (!descriptor.dragKey || !hasDeltaObject) {
      log('drag', 'Missing drag data on commit', descriptor)
      return
    }

    setDragPosition(descriptor.dragKey, descriptor.delta)
    clearDragBase(descriptor.dragKey)

    setAttr(descriptor.element, 'data-swiping', null)
    dispatchReaction(descriptor)
    return
  }

  // ---- SLIDER COMMIT ----
  if (type === 'slider') {
    if (!descriptor.laneId) return
    const lane = ensureLane(descriptor.laneId)
    const base = lane.committedOffset || 0
    const delta = typeof descriptor.delta === 'number' ? descriptor.delta : 0
    lane.committedOffset = base + delta
    lane.offset = lane.committedOffset
    lane.dragging = false
    lane.pendingDir = null

    setAttr(descriptor.element, 'data-swiping', null)
    dispatchReaction(descriptor)
    return
  }

  // ---- CAROUSEL COMMIT ----
  if (!descriptor.laneId) return
  log('swipe', '[', descriptor.direction, ']', 'delta:', descriptor.delta)
  commitLaneSwipe(descriptor.laneId, descriptor.direction)
  setAttr(descriptor.element, 'data-swiping', null)
  dispatchReaction(descriptor)
}

// ----------------- Swipe Revert -----------------
function handleSwipeRevert(descriptor) {
  const type = descriptor.swipeType

  if (type === 'drag') {
    if (descriptor.dragKey) {
      clearDragBase(descriptor.dragKey)
    }
    setAttr(descriptor.element, 'data-swiping', null)
    dispatchReaction(descriptor)
    return
  }

  if (descriptor.laneId) {
    const lane = ensureLane(descriptor.laneId)
    lane.pendingDir = null
    lane.dragging = false
    applyLaneOffset(descriptor.laneId, 0)
  }

  setAttr(descriptor.element, 'data-swiping', null)
  dispatchReaction(descriptor)
}

// ----------------- Renderer Export -----------------
export const renderer = {
  handleReaction(descriptor) {
    log('init', descriptor.type)
    switch (descriptor.type) {
      case 'press':
      case 'pressRelease':
      case 'pressCancel':
        handlePressDescriptor(descriptor)
        break

      case 'select':
      case 'deselect':
        handleSelectDescriptor(descriptor)
        break

      case 'swipeStart':
        handleSwipeStart(descriptor)
        break

      case 'swipe':
        handleSwipe(descriptor)
        break

      case 'swipeCommit':
        handleSwipeCommit(descriptor)
        break

      case 'swipeRevert':
        handleSwipeRevert(descriptor)
        break
    }
  }
}
