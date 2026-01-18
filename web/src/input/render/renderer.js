/**
 * renderer.js - Reaction coordinator (not animator)
 *
 * Receives reaction descriptors and applies:
 * - data-pressed / data-swiping for CSS hooks
 * - carouselState updates for lane carousels
 * - dispatches CustomEvent('reaction', { detail }) for Vue/app hooks
 */

import { ensureLane, applyLaneOffset, commitLaneSwipe } from '../../state/carouselState'
import { getDragPosition, setDragPosition } from '../../state/gestureState'
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

function handleSwipeStart(descriptor) {
  if (!descriptor.laneId) return
  const lane = ensureLane(descriptor.laneId)
  lane.dragging = true
  lane.pendingDir = null
  setAttr(descriptor.element, 'data-swiping', true)
  dispatchReaction(descriptor)
}

function handleSwipe(descriptor) {
  if (!descriptor.laneId) return
  const type = descriptor.swipeType

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

  if (type === 'drag') {
    const base = getDragPosition(descriptor.laneId)
    const delta = descriptor.delta || { x: 0, y: 0 }

    descriptor.absolute = {
      x: base.x + delta.x,
      y: base.y + delta.y
    }

    dispatchReaction(descriptor)
    return
  }

  dispatchReaction(descriptor)
}

function handleSwipeCommit(descriptor) {
  if (!descriptor.laneId) return
  const type = descriptor.swipeType

  if (type === 'slider' || type === 'drag') {
    const lane = ensureLane(descriptor.laneId)
    if (type === 'slider') {
      const base = lane.committedOffset || 0
      const delta = typeof descriptor.delta === 'number' ? descriptor.delta : 0
      lane.committedOffset = base + delta
      lane.offset = lane.committedOffset
    }
    lane.dragging = false
    lane.pendingDir = null

    if (type === 'drag') {
      const base = getDragPosition(descriptor.laneId)
      const delta = descriptor.delta || { x: 0, y: 0 }

      const absolute = {
        x: base.x + delta.x,
        y: base.y + delta.y
      }

      setDragPosition(descriptor.laneId, absolute)
      descriptor.absolute = absolute
    }

    setAttr(descriptor.element, 'data-swiping', null)
    dispatchReaction(descriptor)
    return
  }

  log('swipe', '[', descriptor.direction, ']', 'delta:', descriptor.delta)
  commitLaneSwipe(descriptor.laneId, descriptor.direction)
  setAttr(descriptor.element, 'data-swiping', null)
  dispatchReaction(descriptor)
}

function handleSwipeRevert(descriptor) {
  const type = descriptor.swipeType
  if (type === 'slider' || type === 'drag') {
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

export const renderer = {
  handleReaction(descriptor) {
    switch (descriptor.type) {
      case 'press':
      case 'pressRelease':
      case 'pressCancel': {
        handlePressDescriptor(descriptor)
        break
      }

      case 'select':
      case 'deselect': {
        handleSelectDescriptor(descriptor)
        break
      }

      case 'swipeStart': {
        handleSwipeStart(descriptor)
        break
      }

      case 'swipe': {
        handleSwipe(descriptor)
        break
      }

      case 'swipeCommit': {
        handleSwipeCommit(descriptor)
        break
      }

      case 'swipeRevert': {
        handleSwipeRevert(descriptor)
        break
      }
    }
  }
}