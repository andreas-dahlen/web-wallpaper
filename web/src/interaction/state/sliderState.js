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

/* -------------------------------------------------
   Slider creation / access
------------------------------------------------- */

export function ensureSlider(sliderId) {
  if (!sliderState.sliders[sliderId]) {
    sliderState.sliders[sliderId] = {
      value: 0,
      offset: 0,
      min: 0,
      max: 100,
      stepSize: 1,
      dragging: false
    }
  }
  return sliderState.sliders[sliderId]
}

export function getSlider(sliderId) {
  return sliderState.sliders[sliderId] ?? null
}

/* -------------------------------------------------
   Configuration (called by layout / renderer)
------------------------------------------------- */

export function setSliderBounds(sliderId, min, max) {
  const slider = ensureSlider(sliderId)
  slider.min = min
  slider.max = max
  // Clamp current value to new bounds
  slider.value = Math.max(min, Math.min(max, slider.value))
}

export function setSliderStep(sliderId, stepSize) {
  ensureSlider(sliderId).stepSize = stepSize
}

export function setSliderValue(sliderId, value) {
  const slider = ensureSlider(sliderId)
  slider.value = Math.max(slider.min, Math.min(slider.max, value))
  slider.offset = 0
}

/* -------------------------------------------------
   Dispatcher Actions (single choke point for mutations)
   
   These are the only functions that should mutate
   slider state during gesture handling.
------------------------------------------------- */

/**
 * Start dragging - called by dispatcher on slider:swipeStart
 */
export function startDrag(sliderId) {
  const slider = ensureSlider(sliderId)
  slider.dragging = true
}

/**
 * Apply offset during drag - called by dispatcher on slider:swipe
 */
export function applyOffset(sliderId, offset) {
  ensureSlider(sliderId).offset = offset
}

/**
 * Commit slider to new value - called by dispatcher on slider:swipeCommit
 */
export function commitSlider(sliderId, delta) {
  const slider = ensureSlider(sliderId)
  slider.value = Math.max(slider.min, Math.min(slider.max, slider.value + delta))
  slider.offset = 0
  slider.dragging = false
}
