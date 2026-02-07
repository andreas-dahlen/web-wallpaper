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

export const sliderSolver = {
  /**
   * Handle swipeStart - returns reaction to enable dragging
   */
  swipeStart(desc) {
    desc.reaction = desc.type
    return desc
  },

  /**
   * Handle swipe (drag) - clamp delta so thumb stays within [min, max] visually
   */
  swipe(desc) {
    const { delta, laneSize, min = 0, max = 100, value = 0 } = desc
    
    const range = max - min
    if (!laneSize || !range) {
      desc.delta = delta
      desc.reaction = desc.type
      return desc
    }
    
    // Calculate valid pixel offset range based on current value
    const maxOffset = ((max - value) / range) * laneSize
    const minOffset = ((min - value) / range) * laneSize
    desc.delta = Math.max(minOffset, Math.min(maxOffset, delta))
    
    desc.reaction = desc.type
    return desc
  },

  /**
   * Handle swipeCommit - convert pixel delta to logical delta
   * Clamps result so value stays within [min, max]
   */
  swipeCommit(desc) {
    const { delta, laneSize, min, max, value } = desc
    
    // Guard against division by zero
    if (!laneSize) {
      desc.delta = 0
      desc.reaction = desc.type
      return desc
    }
    
    // Convert pixel delta → logical delta
    const deltaLogical = (delta / laneSize) * (max - min)
    
    // Clamp so resulting value stays in bounds
    // newValue = value + deltaLogical, clamped to [min, max]
    // Therefore deltaLogical must be in [min - value, max - value]
    const clampedDelta = Math.max(min - value, Math.min(max - value, deltaLogical))
    
    desc.delta = clampedDelta  // logical units, safe to apply
    desc.reaction = desc.type
    return desc
  }
}
