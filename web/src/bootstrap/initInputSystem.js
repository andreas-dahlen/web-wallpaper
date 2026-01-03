// src/bootstrap/initInputSystem.js
import { initGestureEngineRouter } from '../input/core/gestureEngineRouter'
import { initCarouselGestureController } from '../input/core/carouselGestureController'

export function initInputSystem() {
  // Low-level input (auto-detects JS or Android)
  initGestureEngineRouter()

  // High-level swipe → state glue
  initCarouselGestureController()
}