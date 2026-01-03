/**
 * Abstract interface for gesture engines.
 * Both JS and Kotlin engines must implement these methods.
 * This ensures identical behavior across platforms.
 */
export class GestureEngine {
  /**
   * Initialize the engine with a target container
   * @param {Element} container - The DOM element to listen on
   */
  init(container) {
    throw new Error('init() must be implemented')
  }

  /**
   * Handle input event
   * @param {string} type - 'down' | 'move' | 'up' | 'cancel'
   * @param {PointerEvent} event - The pointer event
   */
  handle(type, event) {
    throw new Error('handle() must be implemented')
  }

  /**
   * Get current FSM state (for debugging/inspection)
   * @returns {string} Current state: IDLE | PRESS_PENDING | SWIPING
   */
  getState() {
    throw new Error('getState() must be implemented')
  }

  /**
   * Reset engine state completely
   */
  reset() {
    throw new Error('reset() must be implemented')
  }

  /**
   * Optional: Get internal state for serialization/debugging
   * @returns {Object} Current input state
   */
  getInternalState() {
    return {}
  }
}
