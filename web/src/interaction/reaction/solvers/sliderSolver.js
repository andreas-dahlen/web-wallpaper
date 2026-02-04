// sliderSolver.js
/**
 * Slider solver: handles quantized 1D slider movement.
 * 
 * Contract:
 * - Receives descriptor from reactionManager
 * - Uses sliderPolicy for pure decision logic
 * - Returns minimal reaction payload for dispatcher
 * - Does NOT mutate state directly
 * - Does NOT access DOM
 * 
 * This is exactly like carousel, except:
 * - No commit threshold check (always commits)
 * - Quantizes delta to step boundaries on commit
 * - No swipeRevert reaction
 */

import {
  clampDelta,
  resolveDirection,
  getCommitDelta
} from '../policy/sliderPolicy'

export const sliderSolver = {
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
    const { delta, min, max } = desc
    const clampedDelta = clampDelta(delta, min, max)

    desc.reaction = desc.type
    desc.delta = clampedDelta
    return desc
  },

  /**
   * Handle swipeCommit - quantize and commit (no revert)
   */
  swipeCommit(desc) {
    const { delta, axis, stepSize, min, max } = desc
    const commitDelta = getCommitDelta(delta, stepSize, min, max)
    const direction = resolveDirection(commitDelta, axis)

    desc.reaction = desc.type
    desc.direction = direction
    desc.delta = commitDelta
    return desc
  }
}
