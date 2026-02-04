// carouselSolver.js
/**
 * Carousel solver: decides commit vs revert, returns reaction payloads.
 * 
 * Contract:
 * - Receives descriptor from reactionManager
 * - Uses swipePolicy for pure decision logic
 * - Returns minimal reaction payload for dispatcher
 * - Does NOT mutate state directly
 * - Does NOT access DOM
 */

import {
  clampDelta,
  resolveDirection,
  shouldCommit,
  getCommitOffset
} from './swipePolicy'

export const carouselSolver = {
  /**
   * Handle swipeStart - returns reaction to enable dragging
   */
  swipeStart(descriptor) {
    return {
      ...descriptor,
      reaction: {
        type: 'carousel:dragStart',
        laneId: descriptor.laneId
      }
    }
  },

  /**
   * Handle swipe (drag) - clamp delta and return offset reaction
   */
  swipe(descriptor) {
    const { delta, laneId, laneSize } = descriptor
    const clampedDelta = clampDelta(delta, laneSize)

    return {
      ...descriptor,
      delta: clampedDelta,
      reaction: {
        type: 'carousel:offset',
        laneId,
        offset: clampedDelta
      }
    }
  },

  /**
   * Handle swipeCommit - decide commit vs revert
   */
  swipeCommit(descriptor) {
    const { delta, axis, laneId, laneSize } = descriptor
    const clampedDelta = clampDelta(delta, laneSize)
    
    if (shouldCommit(clampedDelta, laneSize)) {
      const direction = resolveDirection(clampedDelta, axis)
      const targetOffset = getCommitOffset(direction, laneSize)

      return {
        ...descriptor,
        delta: clampedDelta,
        reaction: {
          type: 'carousel:commit',
          laneId,
          direction,
          offset: targetOffset
        }
      }
    }
    
    // Revert case
    return {
      ...descriptor,
      type: 'swipeRevert',
      delta: 0,
      reaction: {
        type: 'carousel:revert',
        laneId,
        offset: 0
      }
    }
  }
}

