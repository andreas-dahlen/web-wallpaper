//config/appSettings.js

export const APP_SETTINGS = {
  phone: {
    width: 364,
    height: 800,
    scale: 1.0
  },


  input: {
    swipeThreshold: 8, //distance before swipe is declared
    swipeViewChangeThreshold: 40, //distance before view is changed
  },

  ui: {
    wallpaperWidth: 352,
    wallpaperHeight: 784,
    laneWidth: 352,      // width of a carousel lane
    laneHeight: 265,     // optional, same as phone height
    swipeAnimationMs: 300, // used for CSS transition duration
    swipeSpeedMultiplier: 1.2,
    laneLengths: {
      top: 3,
      mid: 3,
      bottom: 3
    }
  },
}


export const DEBUG = {
  enabled: true,

  // Bridge & Initialization
  kotlinBridge: true,       // Kotlin-JS bridge initialization ✅ ENABLE TO SEE BRIDGE SETUP

  // Input engines
  jsEngine: false,          // JS pointer event handler logs (disable for Android testing)
  androidAdapter: true,     // Android gesture adapter logs ✅ ENABLE FOR ANDROID TESTING

  // Gesture FSM (split to avoid spam)
  fsmTransitions: false,    // FSM state changes: DOWN, UP, CANCEL (disable - reduces noise)
  fsmMove: false,           // FSM MOVE events (fires 60x/sec - very spammy!)

  // Swipe processing
  swipeMovement: false,     // Swipe delta and accumulation logs (disable for cleaner output)
  elementMatching: true,    // Which element matched for gesture ✅ CRITICAL - SHOWS COORDINATE CONVERSION & REGISTRY LOOKUP

  // Component Registration (CRITICAL for debugging)
  targetRegistry: true,     // TouchArea registration/unregistration ✅ CRITICAL - VERIFY COMPONENTS MOUNT
  carouselUpdates: false,   // Carousel state changes (disable until gestures work)

  // Visual/Performance
  drawDots: false,          // Draw pointer position dots on screen (disable for Android)
  lagTime: false,           // Log timing/performance metrics (disable - reduces noise)
}