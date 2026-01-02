//config/appSettings.js
export const APP_SETTINGS = {
  inputMode: 'js', // 'android' | 'js'

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
  enabled: true, // master kill switch

  doubleTrubble: false,
  androidInputs: false,
  jsInputs: true,

  debugLagTime: true,
  drawDots: false,

  FSMDown: false,
  FSMMove: false,
  elTest: true,

  swipeFSM: true,      // for FSM state transitions
  swipeMoves: true,    // for swipe delta logs
}