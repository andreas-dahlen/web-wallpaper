// input/core/gestureEngineRouter.js
import { jsEngine } from '../engines/jsEngine'
import { kotlinEngine } from '../engines/kotlinEngine'

let activeEngine = null

/**
 * Initialize gesture engine router with specified engine type.
 * 
 * @param {string} engineType - 'js' | 'android'
 * @param {Element} container - DOM container to listen on (JS engine only)
 */
export function initGestureEngineRouter(engineType = 'js', container = window) {
  if (engineType === 'android') {
    activeEngine = kotlinEngine
  } else {
    activeEngine = jsEngine
  }

  if (activeEngine?.init) {
    activeEngine.init(container)
  }

  console.log(`[InputRouter] Initialized with ${engineType} engine`)
}

/**
 * Get the currently active engine instance
 */
export function getActiveEngine() {
  return activeEngine
}

/**
 * Switch engines at runtime (useful for testing or fallback)
 */
export function switchEngine(engineType, container = window) {
  if (activeEngine?.reset) {
    activeEngine.reset()
  }
  initInputRouter(engineType, container)
}

/**
 * Legacy API: forward handle() calls to active engine
 */
export function handleInput(type, event) {
  if (!activeEngine) throw new Error('Input engine not initialized. Call initInputRouter() first.')
  activeEngine.handle(type, event)
}

/**
 * Get current engine state (debugging)
 */
export function getEngineState() {
  return activeEngine?.getState?.() ?? 'NOT_INITIALIZED'
}
