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
import { carouselSolver } from './solvers/carouselSolver'
import { sliderSolver } from './solvers/sliderSolver'
import { dragSolver } from './solvers/dragSolver'

/* -------------------------
   Solver routing table
-------------------------- */
const solvers = {
  carousel: carouselSolver,
  slider: sliderSolver,
  drag: dragSolver
}

/* -------------------------
   Core handler
-------------------------- */
export const manage = {
  solveDescriptor(descriptor) {
    if (!descriptor) return

    const { swipeType, type } = descriptor
    const solverfn = solvers[swipeType]?.[type]

    if (solverfn) {
      const result = solverfn(descriptor)
      Object.assign(descriptor, result)
    }
    dispatcher.handle(descriptor)
  }
}
