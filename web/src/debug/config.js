// Debug configuration lives here so it can be reused across app and tooling.
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}

// Prefer explicit VITE_DEBUG override; fall back to disabling in production builds.
const debugOverride = typeof env.VITE_DEBUG === 'string' ? env.VITE_DEBUG.toLowerCase() : undefined
const defaultEnabled = typeof env.PROD === 'boolean' ? !env.PROD : true
const enabled = debugOverride === 'true' ? true : debugOverride === 'false' ? false : defaultEnabled

export const DEBUG = {
  enabled,

  // Bridge & Initialization
  kotlinBridge: false,       // Kotlin-JS bridge initialization

  // Input engines
  jsEngine: false,           // JS pointer event handler logs
  androidAdapter: false,     // Android gesture adapter logs

  // Gesture FSM (split to avoid spam)
  fsmTransitions: false,     // FSM state changes: DOWN, UP, CANCEL
  fsmMove: false,            // FSM MOVE events (fires often)

  // Swipe processing
  swipeMovement: false,      // Swipe delta and accumulation logs
  elementMatching: false,    // Which element matched for gesture

  // Component Registration (CRITICAL for debugging)
  targetRegistry: true,     // TouchArea registration/unregistration
  carouselUpdates: false,    // Carousel state changes

  // UI level
  uiButtons: true,          // Button grid interactions

  // Visual/Performance
  drawDots: true,           // Draw pointer position dots on screen
  lagTime: false,            // Log timing/performance metrics
}
