// src/bootstrap/initInputSystem.js
import { initGestureEngineRouter } from '../input/core/gestureEngineRouter'
import { initCarouselGestureController } from '../input/core/carouselGestureController'

export function initInputSystem() {

  // Low-level input (JS / Android)
  initGestureEngineRouter()

  // High-level swipe → state glue
  initCarouselGestureController()
}