// dragSolver.js
/**
 * Drag solver: handles continuous 2D drag movement.
 * 
 * Contract:
 * - Receives descriptor from reactionManager
 * - Uses dragPolicy for pure decision logic
 * - Returns minimal reaction payload for dispatcher
 * - Does NOT mutate state directly
 * - Does NOT access DOM
 * 
 * This is exactly like carousel, except:
 * - 2D deltas (x, y) instead of single axis
 * - No commit threshold check (always commits)
 * - No swipeRevert reaction
 */

import {
  clampDelta2D,
  resolveDirection,
  getCommitDelta
} from '../policy/dragPolicy'

export const dragSolver = {
  /**
   * Handle swipeStart - returns reaction to enable dragging
   */
  swipeStart(desc) {
    desc.reaction = desc.type
    return desc
  },

  /**
   * Handle swipe (drag) - clamp deltas and return offset reaction
   */
  swipe(desc) {
    const { deltaX, deltaY, bounds } = desc
    const clamped = clampDelta2D(deltaX, deltaY, bounds)

    desc.reaction = desc.type
    desc.deltaX = clamped.x
    desc.deltaY = clamped.y
    return desc
  },

  /**
   * Handle swipeCommit - always commit at current position (no revert)
   */
  swipeCommit(desc) {
    const { deltaX, deltaY, bounds } = desc
    const clamped = clampDelta2D(deltaX, deltaY, bounds)
    const commit = getCommitDelta(clamped.x, clamped.y)
    const direction = resolveDirection(commit.x, commit.y)

    desc.reaction = desc.type
    desc.direction = direction
    desc.deltaX = commit.x
    desc.deltaY = commit.y
    return desc
  }
}
