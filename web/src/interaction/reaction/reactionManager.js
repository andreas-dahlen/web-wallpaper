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

    let result = descriptor
    const swipeType = descriptor.swipeType
    const type = descriptor.type

    // Get the handler for this swipeType / action
    const handler = solvers[swipeType]?.[type]

    if (handler) {
      result = handler(descriptor)
    }
    dispatcher.handle(result)
  }
}
