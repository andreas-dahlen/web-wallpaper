// intentForwarder.js
import { coordinate } from '../render/reactionCoordinator'
import { intentDelegate } from '../resolver/intentDelegator'
import { log } from '../../debug/functions'

export function intentForward(intent) {
  // log('adapter', intent.type, intent)
  const packet = delegate(intent)
forwardPacket(packet)
// console.log('PACKET!', packet)
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
    coordinate.handle(reaction)
  }
}

function delegate(intent) {
  switch (intent.type) {
    case 'press':
      return intentDelegate.onPress(intent)

    case 'swipeStart':
      return intentDelegate.onSwipeStart(intent)

    case 'swipe':
      return intentDelegate.onSwipe(intent)

    case 'swipeEnd':
      return intentDelegate.onSwipeEnd(intent)

    case 'pressRelease':
      return intentDelegate.onPressRelease(intent)

    default:
      console.warn('Unknown intent type', intent)
      return null
  }
}