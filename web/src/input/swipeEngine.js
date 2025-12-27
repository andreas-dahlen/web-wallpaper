// swipeEngine.js
import { reactive } from 'vue'
import { APP_SETTINGS } from '../config/appSettings'

const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeViewChangeThreshold

export const swipeEngine = {
  state: reactive({
    lanes: {
      top: createLaneState(),
      mid: createLaneState(),
      bottom: createLaneState()
    }
  }),

  // --- assign scenes to a lane
  setLaneScenes(lane, scenes) {
    const s = this.state.lanes[lane]
    if (!s) return
    s.scenes = scenes
    s.currentIndex = 0
  },

  handleSwipeStart(data, lane) {
    const s = this.state.lanes[lane]
    if (!s) return
    s.active = true
    s.phase = 'dragging'
    s.delta = 0
    s.dir = null
    s.outcome = null
    s.targetDelta = 0
  },

  handleSwipeMove(data, lane) {
    const s = this.state.lanes[lane]
    if (!s || s.phase !== 'dragging') return
    s.delta = data.total
    s.dir = data.dir
  },

handleSwipeRelease(data, lane, laneSize) {
  const s = this.state.lanes[lane]
  if (!s || s.phase !== 'dragging') return

  const distance = Math.abs(data.total)
  if (distance >= SWIPE_THRESHOLD) {
    s.outcome = data.total < 0 ? 'next' : 'prev'
    s.targetDelta = data.total < 0 ? -laneSize : laneSize
  } else {
    s.outcome = 'revert'
    s.targetDelta = 0
  }

  // settle phase triggers the animation
  s.phase = 'settling'
  s.active = false
},

  reset(lane) {
    const s = this.state.lanes[lane]
    if (!s) return
    Object.assign(s, createLaneState())
  },

  getNextIndex(currentIndex, lane, outcome) {
    const length = this.state.lanes[lane]?.scenes?.length || 1
    if (outcome === 'next') return (currentIndex + 1) % length
    if (outcome === 'prev') return (currentIndex - 1 + length) % length
    return currentIndex
  }
}

function createLaneState() {
  return {
    active: false,
    delta: 0,
    dir: null,
    phase: 'idle',
    outcome: null,
    targetDelta: 0,
    currentIndex: 0,
    scenes: []
  }
}
