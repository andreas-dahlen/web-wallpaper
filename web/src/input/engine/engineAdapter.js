// engineAdapter.js
import { renderer } from '../render/renderer'
import { reactionResolver } from '../render/reactionResolver'
import { log } from '../../debug/functions'

function forward(descriptor) {
  if (!descriptor) return
  if (Array.isArray(descriptor)) {
    for (const d of descriptor) forward(d)
    return
  }
  if (!descriptor.type) {
    console.warn('Invalid reaction descriptor', descriptor)
    return
  }
  renderer.handleReaction(descriptor)
}

export const engineAdapter = {
  onPress(intent) {
    const descriptor = reactionResolver.onPress(intent)
    forward(descriptor?.reactions)
    log('adapter', '[POINTER-PRESSED]', intent)
  },

  onSwipeStart(intent) {
    const descriptor = reactionResolver.onSwipeStart(intent)
    forward(descriptor?.reactions)
    log('adapter', '[SWIPE-START]', intent)
    return {
      accepted: !!descriptor?.intent?.accepted,
      lockAxis: !!descriptor?.intent?.lockAxis
    }
  },

  onSwipe(intent) {
    const descriptor = reactionResolver.onSwipe(intent)
    forward(descriptor)
    log('adapter', '[SWIPE]', intent)
  },

  onSwipeEnd(intent) {
    const descriptor = reactionResolver.onSwipeEnd(intent)
    forward(descriptor)
    log('adapter', '[SWIPE-END]', intent)
  },

  onPressRelease(intent) {
    const descriptor = reactionResolver.onPressRelease(intent)
    forward(descriptor)
    log('adapter', '[POINTER-RELEASED]', intent)
  }
}