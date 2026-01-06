// swipeEngine.js
import { reactive } from 'vue'
import { APP_SETTINGS } from '../config/appSettings'

// Minimum swipe distance to trigger a view change
const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeViewChangeThreshold

export const swipeEngine = {
  // --- Reactive state for all lanes ---
  state: reactive({
    lanes: {
      top: createLaneState(),
      mid: createLaneState(),
      bottom: createLaneState(),
      wallpaper: createLaneState()
    }
  }),

  /** 
   * Assigns scenes/components to a lane
   * @param {string} lane - 'top' | 'mid' | 'bottom'
   * @param {Array} scenes - array of Vue components for this lane
   */
  setLaneScenes(lane, scenes) {
    const laneData = this.state.lanes[lane]
    if (!laneData) return
    laneData.scenes = scenes
    laneData.currentIndex = 0
  },

  /**
   * Called when a swipe gesture starts
   * @param {Object} data - { el, axis, etc. }
   * @param {string} lane
   */
  handleSwipeStart(data, lane) {
    const laneData = this.state.lanes[lane]
    if (!laneData) return

    laneData.active = true
    laneData.phase = 'dragging'
    laneData.delta = 0
    laneData.dir = null
    laneData.outcome = null
    laneData.targetDelta = 0
  },

  /**
   * Called when a swipe is in progress
   * @param {Object} data - { total: number, dir: string }
   * @param {string} lane
   */
  handleSwipeMove(data, lane) {
    const laneData = this.state.lanes[lane]
    if (!laneData || laneData.phase !== 'dragging') return

    laneData.delta = data.total
    laneData.dir = data.dir
  },

  /**
   * Called when a swipe is released
   * Determines whether to move to next/prev/revert based on swipe distance
   * @param {Object} data - { total: number, dir: string }
   * @param {string} lane
   * @param {number} laneSize - width or height of lane for animation offset
   */
  handleSwipeRelease(data, lane, laneSize) {
    const laneData = this.state.lanes[lane]
    if (!laneData || laneData.phase !== 'dragging') return

    const distance = Math.abs(data.total)
    if (distance >= SWIPE_THRESHOLD) {
      laneData.outcome = data.total < 0 ? 'next' : 'prev'
      laneData.targetDelta = data.total < 0 ? -laneSize : laneSize
    } else {
      laneData.outcome = 'revert'
      laneData.targetDelta = 0
    }

    // Switch to settling phase to trigger transition animation
    laneData.phase = 'settling'
    laneData.active = false
  },

  /**
   * Calculates the next index based on the swipe outcome
   * @param {number} currentIndex
   * @param {string} lane
   * @param {string} outcome - 'next' | 'prev' | 'revert'
   * @returns {number} new index
   */
  getNextIndex(currentIndex, lane, outcome) {
    const laneData = this.state.lanes[lane]
    const totalScenes = laneData?.scenes?.length || 1

    if (outcome === 'next') return (currentIndex + 1) % totalScenes
    if (outcome === 'prev') return (currentIndex - 1 + totalScenes) % totalScenes
    return currentIndex
  },

  /**
   * Resets a lane's swipe state after animation
   * Keeps scenes and currentIndex intact
   * @param {string} lane
   */
  reset(lane) {
    const laneData = this.state.lanes[lane]
    if (!laneData) return

    laneData.active = false
    laneData.delta = 0
    laneData.dir = null
    laneData.phase = 'idle'
    laneData.outcome = null
    laneData.targetDelta = 0
  }
}

/**
 * Factory for initial lane state
 */
function createLaneState() {
  return {
    active: false,      // is user currently interacting
    delta: 0,           // current swipe delta (px)
    dir: null,          // swipe direction ('left'/'right'/'up'/'down')
    phase: 'idle',      // 'idle' | 'dragging' | 'settling'
    outcome: null,      // 'next' | 'prev' | 'revert'
    targetDelta: 0,     // final delta for animation
    currentIndex: 0,    // current scene index
    scenes: []          // list of Vue components in this lane
  }
}
