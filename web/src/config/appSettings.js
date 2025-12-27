export const APP_SETTINGS = {
  phone: {
    width: 364,
    height: 800,
    scale: 1.0
  },

  input: {
    swipeThreshold: 12,
    swipeViewChangeThreshold: 100
  },

  ui: {
    laneWidth: 352,      // width of a carousel lane
    laneHeight: 262,     // optional, same as phone height
    swipeAnimationMs: 300, // used for CSS transition duration
    laneLenghts: {
      top: 3,
      mid: 3,
      bottom:3
    }
  },

  debug: {
    input: false,
    drawDots: false,
    logInput: false
  }
}

import A1 from '../scenes/lanes/top/1A.vue'
import B1 from '../scenes/lanes/top/1B.vue'
import C1 from '../scenes/lanes/top/1C.vue'

import A2 from '../scenes/lanes/mid/2A.vue'
import B2 from '../scenes/lanes/mid/2B.vue'
import C2 from '../scenes/lanes/mid/2C.vue'

import A3 from '../scenes/lanes/bottom/3A.vue'
import B3 from '../scenes/lanes/bottom/3B.vue'
import C3 from '../scenes/lanes/bottom/3C.vue'

export const LANES = {
  top: [A1, B1, C1],
  mid: [A2, B2, C2],
  bottom: [A3, B3, C3]
}