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
  resetgestureCycle
} from './reactionHelper'
import { domRegistry } from '../dom/domRegistry'
import { gestureCycle } from './gestureCycle'
import { log } from '../../debug/functions'


/* ------------------------------------------------------------------ */
/* resolver                                                           */
/* ------------------------------------------------------------------ */
export const reactionResolver = {
  onPress(intent) {
    const { x, y } = intent
    const target = domRegistry.findElementAt(x, y)
    if (!target) {
      gestureCycle.resetAll()
      return {
        reactions: null,
        feedback: { accepted: false, lockAxis: false }
      }
    }
    gestureCycle.pressActive = true
    gestureCycle.setCurrent(target)

    if (supports('press', target)) {
      const descriptor = reactionHelper.buildPressDescriptor(intent, target)
      return { reactions: descriptor || null }
    }
  },

  onSwipeStart(intent) {
    const { x, y, proposedAxis } = intent
    const target = gestureCycle.currentTarget
    let accepted = false
    let lockAxis = false

    if (!gestureCycle.pressActive || !gestureCycle.currentTarget) {
      return { reactions: null, feedback: { accepted: false, lockAxis: false } }
    }
    // Check if current target supports this swipe axis
    if (supports(proposedAxis, target)) {
      gestureCycle.swipeActive = true
      gestureCycle.pressActive = false
      gestureCycle.swipeAxis = target.axis
      accepted = true
      lockAxis = target.swipeType !== 'drag'
      const descriptor = reactionHelper.buildSwipeStartDescriptor(intent, gestureCycle.currentTarget, null)
      return {
        reactions: descriptor || null,
        feedback: { accepted, lockAxis }
      }
    } else {
      // Try to find another lane under the pointer that supports this axis
      const newTarget = domRegistry.findLaneByAxis(x, y, proposedAxis)
      if (newTarget) {
        gestureCycle.setCurrent(newTarget)
        gestureCycle.swipeActive = true
        gestureCycle.pressActive = false
        gestureCycle.swipeAxis = newTarget.axis
        accepted = true
        lockAxis = newTarget.swipeType !== 'drag'
        //for pressCancel on previousTarget
        const descriptor = reactionHelper.buildSwipeStartDescriptor(intent, gestureCycle.currentTarget, gestureCycle.previousTarget)
        return {
          reactions: descriptor || null,
          feedback: { accepted, lockAxis }
        }
      }
    }
  },

  onSwipe(intent) {
    if (!gestureCycle.swipeActive || !supports('swipe', gestureCycle.currentTarget)) return null
    const descriptor = reactionHelper.buildSwipeDescriptor(intent, gestureCycle.currentTarget)
    gestureCycle.pressActive = false
    return {
      reactions: descriptor || null
    }
  },

  onSwipeEnd(intent = {}) {
    if (!gestureCycle.swipeActive || !supports('swipeCommit', gestureCycle.currentTarget)) {
      gestureCycle.resetAll()
      return null
    }
    gestureCycle.swipeActive = false
    const descriptor = reactionHelper.buildSwipeDescriptor(intent, gestureCycle.currentTarget)
    gestureCycle.resetAll()
    return {
      reactions: descriptor || null
    }
  },

  onPressRelease(intent) {
    if (!gestureCycle.pressActive || gestureCycle.swipeActive || !supports('pressRelease', gestureCycle.currentTarget)) {
      gestureCycle.resetAll()
      return null
    }
    gestureCycle.pressActive = false
    const descriptor = reactionHelper.buildSwipeDescriptor(intent, gestureCycle.currentTarget)
    gestureCycle.resetAll()
    return {
      reactions: descriptor || null
    }
  }
}