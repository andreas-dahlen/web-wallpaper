// reactionManager.js
/**
 * reactionManager.js
 *
 * Coordinates reactions:
 * - Routes descriptors to appropriate solvers
 * - Dispatches ALL reactions (never suppresses)
 *
 * Contract:
 * - Solvers mutate state and may modify descriptors
 * - Dispatch ALWAYS happens
 */

import { dispatcher } from './dispatcher'
import { carouselSolver } from './carouselSolver'

/* -------------------------
   Solver routing table
-------------------------- */
const solvers = {
  carousel: carouselSolver
  // slider: sliderSolver,
  // drag: dragSolver,
}

/* -------------------------
   Core handler
-------------------------- */
export const coordinate = {
  handle(descriptor) {
    if (!descriptor) return

    // Route to solver if swipeType exists
    const solver = descriptor.swipeType ? solvers[descriptor.swipeType] : null
    let result = descriptor

    if (solver) {
      const handler = solver[descriptor.type]
      if (handler) {
        result = handler(descriptor)
      }
    }

    // Dispatch ALWAYS happens (use result or original descriptor)
    dispatcher.handle(result ?? descriptor)
  }
}
