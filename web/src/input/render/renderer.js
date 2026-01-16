/**
 * renderer.js - Reaction coordinator (not animator)
 *
 * Receives reaction descriptors and applies:
 * - data-pressed / data-swiping for CSS hooks
 * - swipeState updates for lane carousels
 * - dispatches CustomEvent('reaction', {detail}) for Vue/app hooks
 */

import { ensureLane, applyLaneOffset, commitLaneSwipe, setDragPosition, updateLaneMetrics, completeLaneCommit } from '../../state/swipeState'
import { log } from '../../debug/functions'
import { deriveAbsolute, measureLaneMetrics } from './swipeMath'
import { APP_SETTINGS } from '../../config/appSettings'

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

function syncLaneMetrics(descriptor) {
  if (!descriptor.laneId) return null
  const lane = ensureLane(descriptor.laneId)
  const metrics = measureLaneMetrics(descriptor.element, descriptor.axis || descriptor.direction || lane.direction)
  updateLaneMetrics(descriptor.laneId, metrics)
  return lane
}

const laneCommitListeners = new Map()

function awaitLaneCommit(descriptor) {
  const laneId = descriptor.laneId
  const element = descriptor.element
  if (!laneId || !element) return

  const animatedEl = element.querySelector?.('.scene') || element

  const existing = laneCommitListeners.get(laneId)
  if (existing) {
    animatedEl.removeEventListener('transitionend', existing)
    laneCommitListeners.delete(laneId)
  }

  const finalize = () => {
    completeLaneCommit(laneId)
    laneCommitListeners.delete(laneId)
  }

  const handler = (e) => {
    if (e.propertyName !== 'transform') return
    finalize()
    animatedEl.removeEventListener('transitionend', handler)
  }

  laneCommitListeners.set(laneId, handler)
  animatedEl.addEventListener('transitionend', handler)

  const timeoutMs = (APP_SETTINGS?.swipeAnimationMs ?? 300) + 50
  setTimeout(() => {
    if (!laneCommitListeners.has(laneId)) return
    finalize()
    animatedEl.removeEventListener('transitionend', handler)
  }, timeoutMs)
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
        const lane = syncLaneMetrics(descriptor)
        lane.dragging = true
        lane.pendingDir = null
        setAttr(descriptor.element, 'data-swiping', true)
        dispatchReaction(descriptor)
        break
      }

      case 'swipe': {
        if (!descriptor.laneId) break
        const type = descriptor.swipeType

        if (typeof descriptor.delta === 'number') {
          const lane = syncLaneMetrics(descriptor)
          if (type === 'slider') {
            const base = lane.committedOffset || 0
            const absolute = base + descriptor.delta
            lane.offset = absolute
            descriptor.absolute = absolute
          } else {
            applyLaneOffset(descriptor.laneId, descriptor.delta)
          }
          dispatchReaction(descriptor)
          break
        }

          if (type === 'drag') {
            const lane = syncLaneMetrics(descriptor)
            const base = lane?.dragPosition || { x: 0, y: 0 }
            const delta = descriptor.delta || { x: 0, y: 0 }
            const absolute = deriveAbsolute(base, delta)
            descriptor.absolute = absolute
            dispatchReaction(descriptor)
            break
          }

          dispatchReaction(descriptor)
          break
        }

      case 'swipeCommit': {
        if (!descriptor.laneId) break
        const type = descriptor.swipeType
        if (type === 'slider' || type === 'drag') {
          const lane = syncLaneMetrics(descriptor)
          if (type === 'slider') {
            const base = lane.committedOffset || 0
            const delta = typeof descriptor.delta === 'number' ? descriptor.delta : 0
            lane.committedOffset = base + delta
            lane.offset = lane.committedOffset
            descriptor.absolute = lane.committedOffset
          }
          lane.dragging = false
          lane.pendingDir = null
          if (type !== 'slider') {
            const delta = descriptor.delta || { x: 0, y: 0 }
            const base = lane.dragPosition || { x: 0, y: 0 }
            const absolute = deriveAbsolute(base, delta)
            setDragPosition(descriptor.laneId, absolute)
            descriptor.absolute = absolute
          }
          setAttr(descriptor.element, 'data-swiping', null)
          dispatchReaction(descriptor)
          break
        }

        log('swipe', '[', descriptor.direction, ']', 'delta:', descriptor.delta)
        syncLaneMetrics(descriptor)
        commitLaneSwipe(descriptor.laneId, descriptor.direction)
        setAttr(descriptor.element, 'data-swiping', null)
        dispatchReaction(descriptor)
        awaitLaneCommit(descriptor)
        break
      }

      case 'swipeRevert': {
        const type = descriptor.swipeType
        if (type === 'slider' || type === 'drag') {
          break
        }
        if (descriptor.laneId) {
          const lane = syncLaneMetrics(descriptor)
          lane.pendingDir = descriptor.laneDirection || null
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
