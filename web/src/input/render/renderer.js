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
  getDragBase, 
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
  if (!descriptor.laneId) return

  const lane = ensureLane(descriptor.laneId)
  lane.dragging = true
  lane.pendingDir = null
  setAttr(descriptor.element, 'data-swiping', true)
  dispatchReaction(descriptor)
}

// ----------------- Swipe / Drag -----------------
function handleSwipe(descriptor) {
  if (!descriptor.laneId) return
  const type = descriptor.swipeType

  // Number delta (slider / carousel)
  if (typeof descriptor.delta === 'number') {
    const lane = ensureLane(descriptor.laneId)
    if (type === 'slider') {
      const base = lane.committedOffset || 0
      lane.offset = base + descriptor.delta
    } else {
      applyLaneOffset(descriptor.laneId, descriptor.delta)
    }
    dispatchReaction(descriptor)
    return
  }

  // Drag object delta
  if (type === 'drag') {
    const base = getDragBase(descriptor.laneId)
    if (!base) {
      log('drag', 'Missing drag base snapshot', descriptor.laneId)
      return
    }
    const delta = descriptor.delta || { x: 0, y: 0 }

    // Compute absolute from snapshot (renderer-only)
    const absolute = {
      x: base.x + delta.x,
      y: base.y + delta.y
    }

    // Persist absolute for read-only drag frames
    descriptor.absolute = absolute

    dispatchReaction(descriptor)
    return
  }

  dispatchReaction(descriptor)
}

// ----------------- Swipe Commit -----------------
function handleSwipeCommit(descriptor) {
  if (!descriptor.laneId) return
  const type = descriptor.swipeType
  const lane = ensureLane(descriptor.laneId)

  if (type === 'slider' || type === 'drag') {
    // Slider commit
    if (type === 'slider') {
      const base = lane.committedOffset || 0
      const delta = typeof descriptor.delta === 'number' ? descriptor.delta : 0
      lane.committedOffset = base + delta
      lane.offset = lane.committedOffset
    }

    lane.dragging = false
    lane.pendingDir = null

    // Drag commit
    if (type === 'drag') {
      const base = getDragBase(descriptor.laneId)
      if (!base) {
        log('drag', 'Missing drag base on commit', descriptor.laneId)
        return
      }
      const delta = descriptor.delta || { x: 0, y: 0 }
      const absolute = {
        x: base.x + delta.x,
        y: base.y + delta.y
      }
      // Renderer is sole writer of drag persistence
      setDragPosition(descriptor.laneId, absolute)
      descriptor.absolute = absolute
      clearDragBase(descriptor.laneId)
    }

    setAttr(descriptor.element, 'data-swiping', null)
    dispatchReaction(descriptor)
    return
  }

  // Carousel commit
  log('swipe', '[', descriptor.direction, ']', 'delta:', descriptor.delta)
  commitLaneSwipe(descriptor.laneId, descriptor.direction)
  setAttr(descriptor.element, 'data-swiping', null)
  dispatchReaction(descriptor)
}

// ----------------- Swipe Revert -----------------
function handleSwipeRevert(descriptor) {
  const type = descriptor.swipeType
  if (type === 'slider' || type === 'drag') {
    // drag/slider already handled via delta reset in resolver
    if (type === 'drag') clearDragBase(descriptor.laneId)
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
  clearDragBase(descriptor.laneId)
}

// ----------------- Renderer Export -----------------
export const renderer = {
  handleReaction(descriptor) {
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