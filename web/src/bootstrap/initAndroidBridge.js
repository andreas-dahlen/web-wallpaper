import { androidGestureAdapter } from '../input/core/androidGestureAdapter'
import { APP_SETTINGS } from '../config/appSettings'
import { DEBUG } from '../config/appSettings'
import { log } from '../input/debug/gestureDebug'
import { initGestureEngineRouter } from '../input/core/gestureEngineRouter'

/**
 * Global handler called by Kotlin via webView.evaluateJavascript()
 * Bridges Android touch events to the JS gesture system
 */
window.handleTouch = (type, x, y) => {
  if (!DEBUG.enabled) return
  
  log('androidAdapter', `handleTouch('${type}', ${x}, ${y})`)

  switch (type) {
    case 'down':
      androidGestureAdapter.onSwipeDown(x, y)
      break
    case 'move':
      androidGestureAdapter.onSwipeMove(x, y)
      break
    case 'up':
      androidGestureAdapter.onSwipeEnd()
      break
  }
}

/**
 * Called by Kotlin to initialize the Android gesture engine.
 * This switches from JS engine (default) to Android/Kotlin engine.
 */
window.initAndroidEngine = () => {
  APP_SETTINGS.engineType = 'android'
  initGestureEngineRouter('android')
  console.log('[Kotlin Bridge] Android engine initialized')
}