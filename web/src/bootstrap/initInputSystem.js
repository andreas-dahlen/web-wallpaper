// src/bootstrap/initInputSystem.js
import { initInputRouter } from '../input/core/inputRouter'
import { initSwipeLaneController } from '../input/core/swipeLaneController'

export function initInputSystem() {

  // Low-level input (JS / Android)
  initInputRouter()

  // High-level swipe → state glue
  initSwipeLaneController()
}