// intentForwarder.js
import { renderer } from '../render/renderer'
import { reactionDelegate } from '../resolver/reactionDelegator'
import { log } from '../../debug/functions'

export function intentForward(intent) {
  log('adapter', intent.type, intent)
  const packet = delegate(intent)
forwardPacket(packet)
// console.log('PACKET!', 'TYPE: ', intent.type, packet)
  return {
    acceptedGesture: packet?.control?.acceptedGesture === true,
  }
}

function forwardPacket(packet) {
  if (!packet) return
  // log('adapter', packet)
  const reactions = packet.reactions ?? []

  for (const reaction of reactions) {
    if (!reaction?.type) {
      console.warn('Invalid reaction descriptor', reaction, reaction.type)
      continue
    }
    renderer.handleReaction(reaction)
  }
}

function delegate(intent) {
  switch (intent.type) {
    case 'press':
      return reactionDelegate.onPress(intent)

    case 'swipeStart':
      return reactionDelegate.onSwipeStart(intent)

    case 'swipe':
      return reactionDelegate.onSwipe(intent)

    case 'swipeEnd':
      return reactionDelegate.onSwipeEnd(intent)

    case 'pressRelease':
      return reactionDelegate.onPressRelease(intent)

    default:
      console.warn('Unknown intent type', intent)
      return null
  }
}