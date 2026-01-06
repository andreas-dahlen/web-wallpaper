//config/appSettings.js

export const APP_SETTINGS = {
  phone: {
    width: 364,
    height: 800,
    scale: 1.0
  },

  input: {
    swipeThreshold: 8,           // Distance before swipe axis is locked
    swipeViewChangeThreshold: 40 // Distance before view change is committed
  },

  ui: {
    wallpaperWidth: 352,
    wallpaperHeight: 784,
    laneWidth: 352,
    laneHeight: 265,
    // Slightly faster animation for snappier Android feel
    swipeAnimationMs: 250,
    swipeSpeedMultiplier: 1.2,
    laneLengths: {
      top: 3,
      mid: 3,
      bottom: 3
    }
  }
}

// Debug config is now optional - most debug features removed for performance
export const DEBUG = {
  enabled: false,
  gestures: false
}

// Removed LANES exports to match current architecture
