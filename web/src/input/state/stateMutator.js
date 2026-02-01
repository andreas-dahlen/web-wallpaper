// stateMutator.js
/**
 * stateMutator.js
 *
 * Mutates internal state in response to reactions.
 * May return a modified descriptor to override dispatch.
 */

import { ensureLane } from '../state/carouselState'

export const stateMutate = {

  /* -------------------------
     Swipe Start
  -------------------------- */
  solveSwipeStart(descriptor) {
    const lane = ensureLane(descriptor.laneId)
    lane.dragging = true
    lane.pendingDir = null
    // no override
    return null
  },

  /* -------------------------
     Swipe (in-progress)
  -------------------------- */
  solveCarousel(descriptor) {
    const lane = ensureLane(descriptor.laneId)
    
    // in-progress swipe
    if (descriptor.type === 'swipe') {
      lane.offset = descriptor.delta
      return null
    }

    // commit / end swipe
    if (descriptor.type === 'swipeCommit') {
      lane.committedOffset = descriptor.delta ?? 0
      lane.offset = descriptor.delta ?? 0
      lane.dragging = false
      lane.pendingDir = null
      return descriptor
    }

    return null
  },

  /* -------------------------
     Drag (placeholder)
  -------------------------- */
  solveDrag(descriptor) {
    // not implemented yet
    return null
  },

  /* -------------------------
     Slider (placeholder)
  -------------------------- */
  solveSlider(descriptor) {
    // not implemented yet
    return null
  }
}