/**
 * renderer.js - Reaction coordinator (not animator)
 *
 * Receives reaction descriptors and applies:
 * - data-pressed / data-swiping for CSS hooks
 * - swipeState updates for lane carousels
 * - dispatches CustomEvent('reaction', {detail}) for Vue/app hooks
 */

import { ensureLane, applyLaneOffset, commitLaneSwipe } from '../../state/swipeState'
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

export const renderer = {
  handleReaction(descriptor) {
    switch (descriptor.type) {
      case 'press': {
        setAttr(descriptor.element, 'data-pressed', true)
        dispatchReaction(descriptor)
        break
      }

      case 'release': {
        setAttr(descriptor.element, 'data-pressed', null)
        dispatchReaction(descriptor)
        break
      }

      case 'swipe-start': {
        if (!descriptor.laneId) break
        const lane = ensureLane(descriptor.laneId)
        lane.dragging = true
        lane.pendingDir = null
        setAttr(descriptor.element, 'data-swiping', true)
        dispatchReaction(descriptor)
        break
      }

      case 'swipe': {
        if (!descriptor.laneId) break
        applyLaneOffset(descriptor.laneId, descriptor.delta)
        dispatchReaction(descriptor)
        break
      }

      case 'swipe-end': {
        if (!descriptor.laneId) break
        log('swipe', '[', descriptor.direction, ']', 'delta:', descriptor.delta)
        commitLaneSwipe(descriptor.laneId, descriptor.direction)
        setAttr(descriptor.element, 'data-swiping', null)
        dispatchReaction(descriptor)
        break
      }

      case 'cancel': {
        if (descriptor.laneId) {
          const lane = ensureLane(descriptor.laneId)
          lane.offset = 0
          lane.pendingDir = null
          lane.dragging = false
        }
        setAttr(descriptor.element, 'data-swiping', null)
        setAttr(descriptor.element, 'data-pressed', null)
        dispatchReaction(descriptor)
        break
      }
    }
  }
}
