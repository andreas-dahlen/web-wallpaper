// src/config/appSettings.js

export const APP_SETTINGS = {
  phone: {
    width: 364,
    height: 800,
    scale: 1.0   // optional future tweak
  },

  input: {
    swipeThreshold: 12,
    swipeHysteresis: 6,      // future
    allowSwipeCancel: false,  // future
  },

  debug: {
    input: false,
    drawDots: false,
    logInput: false
  }
}
