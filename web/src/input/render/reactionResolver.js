// reactionResolver.js
import { supports, resolveAxis, shouldLockAxis } from './gesturePolicy'
import { descriptorBuilder } from './descriptorBuild'
import { domRegistry } from '../dom/domRegistry'
import { gestureCycle } from './reactionSession'
import { log } from '../../debug/functions'


/* ------------------------------------------------------------------ */
/* resolver                                                           */
/* ------------------------------------------------------------------ */
export const reactionResolver = {
  onPress(intent) {
    const target = domRegistry.findElementAt(intent.delta.x, intent.delta.y)
    log('dom', '[PRESSED]', target, intent.delta.x, intent.delta.y)
    if (!target) {
      gestureCycle.resetAll()
      return { reactions: null }
    }
    gestureCycle.pressActive = true
    gestureCycle.setCurrent(target)

    if (supports('press', gestureCycle.currentTarget)) {
      const descriptor = descriptorBuilder.buildPressDescriptor(intent, gestureCycle.currentTarget)
      return { reactions: descriptor || null }
    }
    return { reactions: null }
  },

  onSwipeStart(intent) {
    let accepted = false
    let lockAxis = false

    if (!gestureCycle.pressActive || !gestureCycle.currentTarget) {
      return { reactions: null, feedback: { accepted, lockAxis } }
    }
    // Check if current target supports this swipe axis
    const resolvedAxis = resolveAxis(intent.axis, gestureCycle.currentTarget)
    if (resolvedAxis) {
      gestureCycle.swipeActive = true
      gestureCycle.pressActive = false
      accepted = true

      lockAxis = shouldLockAxis(gestureCycle.currentTarget)
      log('dom', '[TARGET]', gestureCycle.currentTarget)
      const descriptor = descriptorBuilder.buildSwipeStartDescriptor(intent, gestureCycle.currentTarget, null)
      return {
        reactions: descriptor || null,
        feedback: { accepted, lockAxis }
      }
    } else {
      // Try to find another lane under the pointer that supports this axis
      const newTarget = domRegistry.findLaneByAxis(intent.delta.x, intent.delta.y, intent.axis)
      if (newTarget) {
        gestureCycle.setCurrent(newTarget)
        gestureCycle.swipeActive = true
        gestureCycle.pressActive = false
        accepted = true

        lockAxis = shouldLockAxis(gestureCycle.currentTarget)
        log('dom', '[NEW TARGET]', gestureCycle.currentTarget)
        //for pressCancel on previousTarget aswell
        const descriptor = descriptorBuilder.buildSwipeStartDescriptor(intent, gestureCycle.currentTarget, gestureCycle.previousTarget)
        return {
          reactions: descriptor || null,
          feedback: { accepted, lockAxis }
        }
      }
    }
    gestureCycle.resetAll()
    return { reactions: null, feedback: { accepted, lockAxis } }
  },

  onSwipe(intent) {
    if (!gestureCycle.swipeActive || !supports('swipe', gestureCycle.currentTarget)) return null
    const descriptor = descriptorBuilder.buildSwipeTypeDescriptor(intent, gestureCycle.currentTarget)
    gestureCycle.pressActive = false
    return { reactions: descriptor || null }
  },

  onSwipeEnd(intent) {
    if (!gestureCycle.swipeActive || !supports('swipeCommit', gestureCycle.currentTarget)) {
      gestureCycle.resetAll()
      return { reactions: null }
    }
    gestureCycle.swipeActive = false
    const descriptor = descriptorBuilder.buildSwipeTypeDescriptor(intent, gestureCycle.currentTarget)
    gestureCycle.resetAll()
    return { reactions: descriptor || null }
  },

  onPressRelease(intent) {
    if (!gestureCycle.pressActive || gestureCycle.swipeActive || !supports('pressRelease', gestureCycle.currentTarget)) {
      gestureCycle.resetAll()
      return { reactions: null }
    }
    gestureCycle.pressActive = false
    const descriptor = descriptorBuilder.buildPressReleaseDescriptor(intent, gestureCycle.currentTarget)
    gestureCycle.resetAll()
    return { reactions: descriptor || null }
  }
}