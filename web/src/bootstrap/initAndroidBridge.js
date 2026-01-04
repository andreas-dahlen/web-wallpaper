import { androidGestureAdapter } from '../input/core/androidGestureAdapter'
import { log } from '../input/debug/gestureDebug'
import { initGestureEngineRouter } from '../input/core/gestureEngineRouter'

// Track the current gesture sequence ID to reject stale events
let currentGestureSeqId = 0

/**
 * Global handler called by Kotlin via webView.evaluateJavascript()
 * Bridges Android touch events to the JS gesture system
 * 
 * Called from WebWallpaperService.kt: handleTouch('down/move/up', x, y, seqId)
 * @param {string} type - 'down', 'move', or 'up'
 * @param {number} x - Normalized X coordinate
 * @param {number} y - Normalized Y coordinate  
 * @param {number} seqId - Gesture sequence ID from Kotlin
 */
window.handleTouch = (type, x, y, seqId) => {
  // For 'down' events, update the current sequence ID
  if (type === 'down') {
    currentGestureSeqId = seqId
    log('androidAdapter', `handleTouch ${type} (${x},${y}) seq=${seqId}`)
  } else {
    // For move/up/momentum, reject if seqId doesn't match current gesture
    if (seqId !== currentGestureSeqId) {
      log('androidAdapter', `REJECTED stale ${type} (seq=${seqId}, current=${currentGestureSeqId})`)
      return
    }
    // Don't spam logs for momentum (too many per second)
    if (type !== 'momentum') {
      log('androidAdapter', `handleTouch ${type} (${x},${y})`)
    }
  }

  try {
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
      case 'momentum':
        // Momentum updates: just update position, no drag detection needed
        // The swipe has already ended ('up' was sent), this is post-release physics
        androidGestureAdapter.onMomentumMove(x, y)
        break
      default:
        console.warn('[AndroidBridge] Unknown touch type:', type)
    }
  } catch (err) {
    console.error('[AndroidBridge] Error handling touch event:', err)
  }
}

/**
 * Called by Kotlin to initialize the Android gesture engine.
 * This switches from JS engine (default) to Android adapter mode.
 * 
 * Ensures DOM and Vue components are ready before initialization.
 * Called from WebWallpaperService.kt onPageFinished callback.
 */
window.initAndroidEngine = () => {
  log('kotlinBridge', 'initAndroidEngine called')
  
  const initialize = () => {
    try {
      log('kotlinBridge', 'Starting engine initialization', {
        readyState: document.readyState,
        bodyChildren: document.body?.children.length || 0
      })
      
      initGestureEngineRouter('android')
      log('kotlinBridge', 'Engine initialized successfully')
      
      // Notify Kotlin that initialization succeeded
      if (typeof Android !== 'undefined' && Android.onEngineReady) {
        Android.onEngineReady()
      }
    } catch (err) {
      console.error('[AndroidBridge] Failed to initialize Android engine:', err)
    }
  }

  // If DOM is still loading, wait for it
  if (document.readyState === 'loading') {
    log('kotlinBridge', 'DOM still loading, waiting for DOMContentLoaded')
    document.addEventListener('DOMContentLoaded', () => {
      log('kotlinBridge', 'DOMContentLoaded fired')
      // Give Vue a moment to mount components
      setTimeout(initialize, 100)
    })
  } else {
    // DOM already loaded, but give Vue a moment to mount
    log('kotlinBridge', 'DOM already loaded, delaying initialization slightly')
    setTimeout(initialize, 100)
  }
}

// Log when bridge is ready
log('kotlinBridge', 'Bridge functions registered', {
  handleTouch: typeof window.handleTouch,
  initAndroidEngine: typeof window.initAndroidEngine
})
