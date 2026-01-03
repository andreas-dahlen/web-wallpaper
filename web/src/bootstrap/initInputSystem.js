// src/bootstrap/initInputSystem.js
import { initGestureEngineRouter } from '../input/core/gestureEngineRouter'
import { initCarouselGestureController } from '../input/core/carouselGestureController'
import { APP_SETTINGS } from '../config/appSettings'

export function initInputSystem() {
  // Low-level input (JS / Android)
  initGestureEngineRouter(APP_SETTINGS.engineType)

  // High-level swipe → state glue
  initCarouselGestureController()
}