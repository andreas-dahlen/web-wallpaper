/**
 * renderer.js - Dumb Reaction Executor
 *
 * Receives reaction descriptors and applies:
 * - DOM flags: data-pressed, data-selected, data-swiping
 * - renderer-owned state: dragPositions, dragBase
 * - carouselState updates that are fully resolved upstream
 * - dispatches CustomEvent('reaction', { detail }) for Vue/app hooks
 */

import { ensureLane } from '../state/carouselState'
import { setDragPosition, clearDragBase } from '../state/gestureState'
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
function handlePress(descriptor) {
  const isPressed = descriptor.type === 'press'
  setAttr(descriptor.element, 'data-pressed', isPressed ? true : null)
  dispatchReaction(descriptor)
}

function handleSelect(descriptor) {
  const isSelected = descriptor.type === 'select'
  setAttr(descriptor.element, 'data-selected', isSelected ? true : null)
  dispatchReaction(descriptor)
}

// ----------------- Swipe Start -----------------
function handleSwipeStart(descriptor) {
  if (!descriptor.laneId && descriptor.swipeType !== 'drag') return

  if (descriptor.swipeType === 'drag') {
    setAttr(descriptor.element, 'data-swiping', true)
    dispatchReaction(descriptor)
    return
  }

  const lane = ensureLane(descriptor.laneId)
  lane.dragging = true
  lane.pendingDir = null
  setAttr(descriptor.element, 'data-swiping', true)
  dispatchReaction(descriptor)
}

// ----------------- Swipe / Drag -----------------
function handleSwipe(descriptor) {
  if (descriptor.swipeType === 'drag') {
    if (!descriptor.dragKey || typeof descriptor.delta !== 'object') {
      log('drag', 'Invalid drag frame', descriptor)
      return
    }
    dispatchReaction(descriptor)
    return
  }

  if (!descriptor.laneId) return
  const lane = ensureLane(descriptor.laneId)
  lane.offset = descriptor.delta
  dispatchReaction(descriptor)
}

// ----------------- Swipe Commit -----------------
function handleSwipeCommit(descriptor) {
  const type = descriptor.swipeType

  if (type === 'drag') {
    if (!descriptor.dragKey || typeof descriptor.delta !== 'object') {
      log('drag', 'Missing drag data on commit', descriptor)
      return
    }

    setDragPosition(descriptor.dragKey, descriptor.delta)
    clearDragBase(descriptor.dragKey)

    setAttr(descriptor.element, 'data-swiping', null)
    dispatchReaction(descriptor)
    return
  }

  if (!descriptor.laneId) return
  const lane = ensureLane(descriptor.laneId)
  lane.committedOffset = descriptor.delta
  lane.offset = descriptor.delta
  lane.dragging = false
  lane.pendingDir = null

  setAttr(descriptor.element, 'data-swiping', null)
  dispatchReaction(descriptor)
}

// ----------------- Swipe Revert -----------------
function handleSwipeRevert(descriptor) {
  if (descriptor.swipeType === 'drag') {
    if (descriptor.dragKey) clearDragBase(descriptor.dragKey)
    setAttr(descriptor.element, 'data-swiping', null)
    dispatchReaction(descriptor)
    return
  }

  if (!descriptor.laneId) return
  const lane = ensureLane(descriptor.laneId)
  lane.dragging = false
  lane.pendingDir = null
  lane.offset = descriptor.delta

  setAttr(descriptor.element, 'data-swiping', null)
  dispatchReaction(descriptor)
}

// ----------------- Renderer Export -----------------
export const renderer = {
  handleReaction(descriptor) {
    log('renderer', descriptor.type)
    switch (descriptor.type) {
      case 'press':
      case 'pressRelease':
      case 'pressCancel':
        handlePress(descriptor)
        break

      case 'select':
      case 'deselect':
        handleSelect(descriptor)
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
