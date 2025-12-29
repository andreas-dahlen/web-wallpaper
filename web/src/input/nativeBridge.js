// input/nativeBridge.js
import { inputEngine } from './inputEngine'
import { drawDot, log } from './debugInput'

let isPressing = false // track active press

window.handleTouch = function (type, x, y) {
  const e = { clientX: x, clientY: y }

  switch (type) {
    case 'down':
      isPressing = true
      inputEngine._down(e)
      log('input', 'logNative', '↓ NATIVE DOWN', 
          'x=', x.toFixed(1), 
          'y=', y.toFixed(1), 
          'active=', isPressing)
      drawDot(x, y, 'lime') // down
      break
    case 'move':
      if (isPressing) {
        inputEngine._move(e)
        log('input', 'logNative', '↔ NATIVE MOVE', 
            'x=', x.toFixed(1), 
            'y=', y.toFixed(1), 
            'active=', isPressing)
        drawDot(x, y, 'orange') // move while pressing
      }
      break
    case 'up':
      if (isPressing) {
        inputEngine._up(e)
        log('input', 'logNative', '↑ NATIVE UP', 
            'x=', x.toFixed(1), 
            'y=', y.toFixed(1), 
            'active(before)=', isPressing)
        drawDot(x, y, 'red') // release
        isPressing = false
      }
      break
  }
}

// DEV helper for browser
if (import.meta.env.DEV) {
  window.simulateNativeTouch = window.handleTouch

  window.addEventListener('mousedown', e => handleTouch('down', e.clientX, e.clientY))
  window.addEventListener('mousemove', e => handleTouch('move', e.clientX, e.clientY))
  window.addEventListener('mouseup', e => handleTouch('up', e.clientX, e.clientY))

  window.addEventListener('touchstart', e => handleTouch('down', e.touches[0].clientX, e.touches[0].clientY))
  window.addEventListener('touchmove', e => handleTouch('move', e.touches[0].clientX, e.touches[0].clientY))
  window.addEventListener('touchend', e => handleTouch('up', e.changedTouches[0].clientX, e.changedTouches[0].clientY))
}
