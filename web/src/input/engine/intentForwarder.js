// intentForwarder.js
import { renderer } from '../render/renderer'
import { reactionDelegate } from '../resolver/reactionDelegator'
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
    const result = reactionDelegate.onPress(intent)
    forwardReactions(result)
    log('adapter', '[POINTER-PRESSED]', intent)
  },

  onSwipeStart(intent) {
    const result = reactionDelegate.onSwipeStart(intent)
    forwardReactions(result)
    log('adapter', '[SWIPE-START]', intent)

    return {
      accepted: !!result?.control?.accepted,
      lockAxis: !!result?.control?.lockAxis
    }
  },

  onSwipe(intent) {
    const result = reactionDelegate.onSwipe(intent)
    forwardReactions(result)
    log('adapter', '[SWIPE]', intent)
  },

  onSwipeEnd(intent) {
    const result = reactionDelegate.onSwipeEnd(intent)
    forwardReactions(result)
    log('adapter', '[SWIPE-END]', intent)
  },

  onPressRelease(intent) {
    const result = reactionDelegate.onPressRelease(intent)
    forwardReactions(result)
    log('adapter', '[POINTER-RELEASED]', intent)
  }
}