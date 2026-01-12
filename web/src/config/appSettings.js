export const APP_SETTINGS = {
  debugPanel: true,
  DebugWrapper: true,
  platform: import.meta.env.VITE_PLATFORM || 'web',

  rawPhoneValues: {
    width: 1272,
    height: 2800,
    density: 3.5
  },

  laneHeight: 267,
  swipeAnimationMs: 250,
  swipeSpeedMultiplier: 1.2,
  laneLengths: {
    top: 3,
    mid: 3,
    bottom: 3
  },

  swipeThresholdRatio: 0.05,// start of swipe distance
  swipeCommitRatio: 0.2 // commitmant distance on release
}