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
} from '../policy/carouselPolicy'

export const carouselSolver = {
  /**
   * Handle swipeStart - returns reaction to enable dragging
   */
  swipeStart(desc) {
    desc.reaction = desc.type
    return desc
  },

  /**
   * Handle swipe (drag) - clamp delta and return offset reaction
   */
  swipe(desc) {
    const { delta, laneSize } = desc
    const clampedDelta = clampDelta(delta, laneSize)

    desc.reaction = desc.type
    desc.delta = clampedDelta
    return desc

  },

  /**
   * Handle swipeCommit - decide commit vs revert
   */
  swipeCommit(desc) {
    const { delta, axis, laneSize } = desc
    const clampedDelta = clampDelta(delta, laneSize)

    if (shouldCommit(clampedDelta, laneSize)) {
      const direction = resolveDirection(clampedDelta, axis)
      const targetOffset = getCommitOffset(direction, laneSize)

      desc.reaction = desc.type
      desc.direction = direction
      desc.delta = targetOffset
      return desc
    }
    // Revert case
    desc.reaction = 'swipeRevert'
    return desc
  }
}


