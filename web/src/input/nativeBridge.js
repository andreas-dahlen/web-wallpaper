// input/nativeBridge.js
import { inputEngine } from './inputEngine'
import { debugDown, debugMove, debugUp } from './debugInput'

// Receives normalized or raw coordinates from Kotlin / WebView
window.handleTouch = function (type, x, y) {
  const e = { clientX: x, clientY: y }

  switch (type) {
    case 'down':
      debugDown(x, y)    // logs + dots
      inputEngine._down(e)
      break
    case 'move':
      debugMove(x, y)
      inputEngine._move(e)
      break
    case 'up':
      debugUp(x, y)
      inputEngine._up(e)
      break
  }
}

// DEV helper for browser
if (import.meta.env.DEV) {
  window.simulateNativeTouch = window.handleTouch
}
