// reactionCoordinator.js
/**
 * reactionCoordinator.js
 *
 * Coordinates reactions:
 * - Sorts and calls stateMutate
 * - Dispatches reactions to dispatcher
 *
 * Expandable: later add gestureState, math, drag tracking, etc.
 */

import { enableDragging, clearPendingDir, applyLaneOffset, commitLane } from '../state/carouselState'
import { dispatcher } from './dispatcher'

/* -------------------------
   Core handler
-------------------------- */
export const coordinate = {
  handle(descriptor) {
    if (!descriptor) return

    if (!descriptor.swipeType) {
      dispatcher.handle(descriptor)
      return
    }

    const { type, swipeType } = descriptor

    const result = stateMutate[type]?.[swipeType]?.(descriptor)

    dispatcher.handle(result ?? descriptor)
  }
}

const stateMutate = {
  swipeStart: {
    carousel(packet) {
      enableDragging(packet.laneId)
      clearPendingDir(packet.laneId)
      return null
    },
    slider(packet) {
      // call slider helpers here
      return null
    },
    drag(packet) {
      // call drag helpers here
      return null
    }
  },

  swipe: {
    carousel(packet) {
      applyLaneOffset(packet.laneId, packet.delta)
      return null
    },
    slider(packet) {
      // call slider helpers here
      return null
    },
    drag(packet) {
      // call drag helpers here
      return null
    }
  },

  swipeCommit: {
    carousel(packet) {
      commitLane(packet.laneId, packet.delta)
      return packet
    },
    slider(packet) {
      // call slider commit helpers here
      return packet
    },
    drag(packet) {
      // call drag commit helpers here
      return packet
    }
  }
}
