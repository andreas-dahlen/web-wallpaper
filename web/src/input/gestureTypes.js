/**
 * All events emitted by the input system.
 * This is the contract between JS <-> Kotlin.
 */

export const GestureType = {
  PRESS_START: 'pressStart',
  PRESS_END: 'pressEnd',
  SWIPE_START: 'swipeStart',
  SWIPE_MOVE: 'swipeMove',
  SWIPE_END: 'swipeEnd'
}