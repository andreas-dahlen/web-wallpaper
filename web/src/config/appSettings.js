export const APP_SETTINGS = {
  debugWrapper: false,
  debugPanel: true,
  platform: import.meta.env.VITE_PLATFORM || 'web',

  laneHeight: 267,
  swipeAnimationMs: 250,
  swipeSpeedMultiplier: 1.2,
  laneLengths: {
    top: 3,
    mid: 3,
    bottom: 3
  },

  swipeThreshold: 8,
  swipeViewChangeThreshold: 40
}