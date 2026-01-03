// input/core/gestureEngineRouter.js
import { jsEngine } from '../engines/jsEngine'
import { log } from '../debug/gestureDebug'

let activeEngine = null
let currentMode = null

/**
 * Auto-detect engine type based on environment.
 * Returns 'android' if Android JSBridge exists, otherwise 'js'.
 */
function detectEngineType() {
  return (typeof Android !== 'undefined') ? 'android' : 'js'
}

/**
 * Initialize gesture engine router with specified engine type.
 * If no type provided, auto-detects based on environment.
 * 
 * @param {string} engineType - 'js' | 'android' | undefined (auto-detect)
 * @param {Element} container - DOM container to listen on (JS engine only)
 * 
 * IMPORTANT: Android mode uses androidGestureAdapter (not kotlinEngine).
 * The adapter receives events via window.handleTouch() from Kotlin SwipeEngine.
 * JS mode uses jsEngine for DOM-based gesture detection.
 */
export function initGestureEngineRouter(engineType, container = window) {
  // Auto-detect if not specified
  if (!engineType) {
    engineType = detectEngineType()
    log('jsEngine', 'Auto-detected engine type:', engineType)
  }

  currentMode = engineType

  if (engineType === 'android') {
    // Android mode: gestures handled by androidGestureAdapter via window.handleTouch()
    // No engine initialization needed - adapter is wired in initAndroidBridge.js
    activeEngine = null
    log('androidAdapter', 'Router initialized - using androidGestureAdapter bridge')
  } else {
    // JS mode: use jsEngine for DOM gesture detection
    activeEngine = jsEngine
    if (activeEngine?.init) {
      activeEngine.init(container)
    }
    log('jsEngine', 'Router initialized - using jsEngine for DOM gestures')
  }
}

/**
 * Get the currently active engine instance
 * Returns null in android mode (uses adapter instead)
 */
export function getActiveEngine() {
  return activeEngine
}

/**
 * Get current mode
 */
export function getCurrentMode() {
  return currentMode
}

/**
 * Switch engines at runtime (useful for testing or fallback)
 */
export function switchEngine(engineType, container = window) {
  if (activeEngine?.reset) {
    activeEngine.reset()
  }
  log('jsEngine', 'Switching engine to:', engineType)
  initGestureEngineRouter(engineType, container)
}

/**
 * Legacy API: forward handle() calls to active engine
 * In android mode, this is a no-op (adapter handles events instead)
 */
export function handleInput(type, event) {
  if (!activeEngine) {
    // Android mode - events handled by adapter
    return
  }
  activeEngine.handle(type, event)
}

/**
 * Get current engine state (debugging)
 */
export function getEngineState() {
  if (currentMode === 'android') {
    return 'ANDROID_ADAPTER_MODE'
  }
  return activeEngine?.getState?.() ?? 'NOT_INITIALIZED'
}
