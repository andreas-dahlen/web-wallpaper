// src/bootstrap/initInputSystem.js
import { initGestureEngineRouter } from '../input/core/gestureEngineRouter'
import { initCarouselGestureController } from '../input/core/carouselGestureController'
import { log } from '../input/debug/gestureDebug'

export function initInputSystem() {
  // Low-level input (auto-detects JS or Android)
  initGestureEngineRouter()

  // High-level swipe → state glue
  initCarouselGestureController()

  log('jsEngine', 'Input system initialized', {
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
  })
}