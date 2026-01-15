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

      case 'pressRelease': {
        setAttr(descriptor.element, 'data-pressed', null)
        dispatchReaction(descriptor)
        break
      }

      case 'pressCancel': {
        setAttr(descriptor.element, 'data-pressed', null)
        dispatchReaction(descriptor)
        break
      }

      case 'select': {
        setAttr(descriptor.element, 'data-selected', true)
        dispatchReaction(descriptor)
        break
      }

      case 'deselect': {
        setAttr(descriptor.element, 'data-selected', null)
        dispatchReaction(descriptor)
        break
      }

      case 'swipeStart': {
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
        if (typeof descriptor.delta === 'number') {
          applyLaneOffset(descriptor.laneId, descriptor.delta)
        }
        dispatchReaction(descriptor)
        break
      }

      case 'swipeCommit': {
        if (!descriptor.laneId) break
        const type = descriptor.swipeType
        if (type === 'slider' || type === 'drag' || type === 'drag-and-drop' || type === 'dragAndDrop') {
          setAttr(descriptor.element, 'data-swiping', null)
          dispatchReaction(descriptor)
          break
        }

        log('swipe', '[', descriptor.direction, ']', 'delta:', descriptor.delta)
        commitLaneSwipe(descriptor.laneId, descriptor.direction)
        setAttr(descriptor.element, 'data-swiping', null)
        dispatchReaction(descriptor)
        break
      }

      case 'swipeRevert': {
        const type = descriptor.swipeType
        if (type === 'slider' || type === 'drag' || type === 'drag-and-drop' || type === 'dragAndDrop') {
          break
        }
        if (descriptor.laneId) {
          const lane = ensureLane(descriptor.laneId)
          lane.pendingDir = null
          lane.dragging = false
          applyLaneOffset(descriptor.laneId, 0)
        }
        setAttr(descriptor.element, 'data-swiping', null)
        dispatchReaction(descriptor)
        break
      }
    }
  }
}
