// carouselSolver.js
/**
 * Carousel solver: decides commit vs revert, clamps deltas, mutates carouselState.
 * 
 * Contract:
 * - Receives descriptor from reactionManager
 * - Mutates carouselState as needed
 * - Returns (possibly modified) descriptor for dispatcher
 * - Returning the descriptor (even unmodified) ensures dispatch happens
 */

import {
  ensureLane,
  enableDragging,
  disableDragging,
  clearPendingDir,
  applyLaneOffset,
  commitLaneSwipe,
  commitLane
} from '../state/carouselState'
import { APP_SETTINGS } from '../../config/appSettings'

export const carouselSolver = {
  /**
   * Handle swipeStart for carousel
  */
 swipeStart(descriptor) {
   const { laneId } = descriptor
    enableDragging(laneId)
    clearPendingDir(laneId)
    return descriptor
  },
  
  /**
   * Handle swipe (drag) for carousel - clamp and apply offset
  */
 swipe(descriptor) {
   const { laneId, delta } = descriptor
   const lane = ensureLane(laneId)
   const clamped = clampDelta(delta, lane.size)
   
   applyLaneOffset(laneId, clamped)
   
   return {
     ...descriptor,
     delta: clamped
    }
  },
  
  /**
   * Handle swipeCommit for carousel - decide commit vs revert
  */
 swipeCommit(descriptor) {
   const { laneId, delta, axis } = descriptor
   const lane = ensureLane(laneId)
   const clamped = clampDelta(delta, lane.size)
   
   if (shouldCommit(clamped, lane.size)) {
     // Commit: animate to next/prev item
     const dir = resolveDirection(clamped, axis)
     commitLaneSwipe(laneId, dir)
     
     //commit
     return {
       ...descriptor,
       delta: clamped
      }
    } else {
      commitLane(laneId, 0)
      disableDragging(laneId)
      
      //revert
      return {
        ...descriptor,
        type: 'swipeRevert',
        delta: 0
      }
    }
  }
}

/* -------------------------
   Internal helpers
-------------------------- */

function clampDelta(delta, laneSize) {
  if (!laneSize) return delta
  const max = laneSize
  return Math.max(-max, Math.min(max, delta))
}

function resolveDirection(delta, axis) {
  if (delta === 0) return null
  if (axis === 'horizontal') {
    return delta > 0 ? 'right' : 'left'
  }
  return delta > 0 ? 'down' : 'up'
}

function shouldCommit(delta, laneSize) {
  if (!laneSize) return false
  const threshold = laneSize * APP_SETTINGS.swipeCommitRatio
  return Math.abs(delta) >= threshold
}