// input/nativeBridge.js
import { inputEngine } from './inputEngine'

// Receives normalized or raw coordinates from Kotlin / WebView
window.handleTouch = function (type, x, y) {
  const e = { clientX: x, clientY: y }

  switch (type) {
    case 'down':
      inputEngine._down(e)
      break
    case 'move':
      inputEngine._move(e)
      break
    case 'up':
      inputEngine._up(e)
      break
  }
}

// DEV helper for browser
if (import.meta.env.DEV) {
  window.simulateNativeTouch = window.handleTouch
}
