// intentForwarder.js
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

function forwardReactions(result) {
  if (!result) return
  // If this is an envelope, only forward actual reactions
  if ('reactions' in result) {
    if (!result.reactions) return
    forward(result.reactions)
    return
  }
  // Otherwise assume it's already a descriptor or array
  forward(result)
}

export const intentForward = {
  onPress(intent) {
    const result = reactionResolver.onPress(intent)
    forwardReactions(result)
    log('adapter', '[POINTER-PRESSED]', intent)
  },

  onSwipeStart(intent) {
    const result = reactionResolver.onSwipeStart(intent)
    forwardReactions(result)
    log('adapter', '[SWIPE-START]', intent)

    return {
      accepted: !!result?.feedback?.accepted,
      lockAxis: !!result?.feedback?.lockAxis
    }
  },

  onSwipe(intent) {
    const result = reactionResolver.onSwipe(intent)
    forwardReactions(result)
    log('adapter', '[SWIPE]', intent)
  },

  onSwipeEnd(intent) {
    const result = reactionResolver.onSwipeEnd(intent)
    forwardReactions(result)
    log('adapter', '[SWIPE-END]', intent)
  },

  onPressRelease(intent) {
    const result = reactionResolver.onPressRelease(intent)
    forwardReactions(result)
    log('adapter', '[POINTER-RELEASED]', intent)
  }
}