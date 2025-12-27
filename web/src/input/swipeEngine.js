// swipeEngine.js
import { reactive } from 'vue'
import { APP_SETTINGS } from '../config/appSettings'
import { swipeNext, swipePrev } from '../scenes/state/SwipeState'

const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeViewChangeThreshold

export const swipeEngine = {
  state: reactive({
    activeLane: null,
    delta: 0,
    dir: null
  }),

  handleSwipeStart(data, lane) {
    this.state.activeLane = lane
    this.state.delta = 0
    this.state.dir = null
    // console.log(`[SwipeEngine] Start lane=${lane}, axis=${data.axis}`)
    console.log('_')
  },

  handleSwipeMove(data) {
    if (!this.state.activeLane) return
    this.state.delta = data.total
    this.state.dir = data.dir
    // console.log(`[SwipeEngine] Move lane=${this.state.activeLane}, dir=${data.dir}, delta=${data.total}`)
    console.log('_')
    // Optional: here you could emit a reactive delta to animate lane in real-time
  },

  handleSwipeRelease(data) {
    if (!this.state.activeLane) return

    const lane = this.state.activeLane
    const total = data.total
    const dir = data.dir

    console.log('_')
    // console.log(`[SwipeEngine] Release lane=${lane}, dir=${dir}, total=${total}`)

    if (Math.abs(total) >= SWIPE_THRESHOLD) {
      if (dir === 'left') swipePrev(lane)
      if (dir === 'right') swipeNext(lane)
    } else {
      console.log(`[SwipeEngine] Swipe too short, revert lane=${lane}`)
      // Optional: trigger revert animation here
    }

    // Reset
    this.state.activeLane = null
    this.state.delta = 0
    this.state.dir = null
  }
}
