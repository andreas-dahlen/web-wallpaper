/**
 * Shared gesture state structure used by all engines.
 * This ensures consistent state across JS and Android engines.
 */
export function createGestureState() {
  return {
    // FSM state
    fsmState: 'IDLE', // IDLE | PRESS_PENDING | SWIPING
    
    // Press-related
    pressCandidate: null,
    
    // Swipe-related
    swipeCandidate: null,
    swipeAxis: null, // 'horizontal' | 'vertical' | null
    swipeAccum: 0,
    swipeStarted: false,
    
    // Position tracking
    start: { x: 0, y: 0 },
    last: { x: 0, y: 0 }
  }
}

/**
 * Reset gesture state to idle
 */
export function resetGestureState(state) {
  state.fsmState = 'IDLE'
  state.pressCandidate = null
  state.swipeCandidate = null
  state.swipeAxis = null
  state.swipeAccum = 0
  state.swipeStarted = false
  state.start.x = state.start.y = 0
  state.last.x = state.last.y = 0
}
