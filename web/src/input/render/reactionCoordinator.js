// reactionCoordinator.js
/**
 * reactionCoordinator.js
 *
 * Coordinates reactions:
 * - Sorts and calls stateMutate
 * - Dispatches reactions to dispatcher
 *
 * Expandable: later add gestureState, math, drag tracking, etc.
 */

import { stateMutate } from '../state/stateMutator'
import { dispatcher } from './dispatcher'

/* -------------------------
   Core handler
-------------------------- */
export const coordinate = {
  handle(descriptor) {
    if (!descriptor) return

    if (descriptor.delta) {
      const { x, y } = descriptor.delta

      if (x === 0 && y === 0) descriptor.delta = 0
      else if (x !== 0 && y === 0) descriptor.delta = x
      else if (x === 0 && y !== 0) descriptor.delta = y
      // else leave {x, y} as-is
    }
    if (!descriptor.swipeType) {
      dispatcher.handle(descriptor)
      return
    }

    const swipeType = descriptor.swipeType
    const type =
      descriptor.type === 'swipeEnd'
        ? 'swipeCommit'
        : descriptor.type

    const result = stateMutate[type]?.[swipeType]?.(descriptor)

    dispatcher.handle(result ?? descriptor)
  }
}

//   handlePress(descriptor) {
//     dispatcher.handle(descriptor)
//   },

//   handleSwipeStart(descriptor) {
//     if (!descriptor.laneId) return
//     //posibly sort by laneType..
//     stateMutate.solveSwipeStart(descriptor)
//     dispatcher.handle(descriptor)
//   },

// handleSwipe(descriptor) {
//   if (!descriptor.laneId) return

//   let resolved = null

//   switch (descriptor.swipeType) {
//     case 'drag':
//       resolved = stateMutate.solveDrag(descriptor)
//       break
//     case 'carousel':
//       resolved = stateMutate.solveCarousel(descriptor)
//       break
//     case 'slider':
//       resolved = stateMutate.solveSlider(descriptor)
//       break
//   }

//   dispatcher.handle(resolved ?? descriptor)
// },

//   handleSwipeEnd(descriptor) {
//     if (!descriptor.laneId) return
//     descriptor.type = 'swipeCommit'
//     if (descriptor.swipeType === 'carousel') {
//       const solvedCarousel = stateMutate.solveCarousel(descriptor)
//       dispatcher.handle(solvedCarousel)
//       return
//     } else {
//       // all swipeEnd reactions are commits here
//       dispatcher.handle(descriptor)
//     }
//   }
