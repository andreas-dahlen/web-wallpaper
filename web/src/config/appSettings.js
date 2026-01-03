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
    laneLenghts: {
      top: 3,
      mid: 3,
      bottom: 3
    }
  },
}


export const DEBUG = {
  enabled: true,

  // Input engines
  jsEngine: true,           // JS pointer event handler logs
  androidAdapter: true,     // Android gesture adapter logs

  // Gesture FSM (split to avoid spam)
  fsmTransitions: true,     // FSM state changes: DOWN, UP, CANCEL
  fsmMove: false,            // FSM MOVE events (fires 60x/sec - very spammy!)

  // Swipe processing
  swipeMovement: true,      // Swipe delta and accumulation logs
  elementMatching: false,    // Which element matched for gesture

  // UI/Carousel integration
  targetRegistry: false,     // Element registration/unregistration
  carouselUpdates: true,    // Carousel state changes from gestures

  // Visual/Performance
  drawDots: false,           // Draw pointer position dots on screen
  lagTime: false,            // Log timing/performance metrics
}