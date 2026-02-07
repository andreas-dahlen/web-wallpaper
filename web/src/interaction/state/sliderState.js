import { reactive } from 'vue'

/**
 * sliderState.js - Slider state management
*
* This is exactly like carouselState, except:
* - No index/count (continuous value instead of discrete items)
* - No pendingDir (no revert behavior)
* - Tracks current value and offset during drag
*/

/* -------------------------------------------------
Central slider state

This is a passive reactive store. All mutations
should flow through dispatcher actions.
------------------------------------------------- */

export const sliderState = reactive({
  sliders: {}
})


// export function getSlider(laneId) {
//   return sliderState.sliders[laneId] ?? null
// }
/* -------------------------------------------------
Slider creation / access
------------------------------------------------- */

export const sliderStateFn = {
  getSize(laneId) {
    return sliderState.sliders[laneId]?.size ?? 0
  },
  getMin(laneId) {
    return sliderState.sliders[laneId]?.min ?? 0
  },
  getMax(laneId) {
    return sliderState.sliders[laneId]?.max ?? 100
  },
  getValue(laneId) {
    return sliderState.sliders[laneId]?.value ?? 0
  },
  ensure(laneId) {
    if (!sliderState.sliders[laneId]) {
      sliderState.sliders[laneId] = {
        value: 0,       // logical position (0–100 or whatever)
        offset: 0,      // optional for live dragging
        min: 0,
        max: 100,
        size: 0,
      }
    }
    return sliderState.sliders[laneId]
  },
  setMinMax(laneId, min, max) {
    const slider = this.ensure(laneId)
    slider.min = min
    slider.max = max
  },
  setSize(laneId, size) {
    this.ensure(laneId).size = size
  },
  /* -------------------------------------------------
     Dispatcher Actions (single choke point for mutations)
     
     These are the only functions that should mutate
     slider state during gesture handling.
  ------------------------------------------------- */

  /**
   * Start dragging - called by dispatcher on slider:swipeStart
   */
  swipeStart(desc) {
    const slider = this.ensure(desc.laneId)
    slider.dragging = true
  },
  /**
   * Apply offset during drag - called by dispatcher on slider:swipe
   */
  swipe(desc) {
    this.ensure(desc.laneId).offset = desc.delta
  },

  /**
   * Commit slider to new value - called by dispatcher on slider:swipeCommit
   * Receives logical delta (already converted from pixels by solver)
   */
  swipeCommit(desc) {
    const slider = this.ensure(desc.laneId)
    // desc.delta is already in logical units (converted by solver)
    slider.value = Math.min(slider.max, Math.max(slider.min, slider.value + desc.delta))
    slider.offset = 0
    slider.dragging = false
  }
}

/* -------------------------------------------------
   Configuration (called by layout / renderer)
------------------------------------------------- */



// function setSliderBounds(laneId, min, max) {
//   const slider = this.ensure(laneId)
//   slider.min = min
//   slider.max = max
//   // Clamp current value to new bounds
//   slider.value = Math.max(min, Math.min(max, slider.value))
// }

// function setSliderStep(laneId, stepSize) {
//   this.ensure(laneId).stepSize = stepSize
// }

// function setSliderValue(laneId, value) {
//   const slider = this.ensure(laneId)
//   slider.value = Math.max(slider.min, Math.min(slider.max, value))
//   slider.offset = 0
// }

