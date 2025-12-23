import { APP_SETTINGS } from '../config/appSettings'

export const DEBUG_INPUT = {
  enabled: APP_SETTINGS.debug.drawDots,
  log: APP_SETTINGS.debug.logInput
}

function log(...args) {
  if (DEBUG_INPUT.log) {
    console.log('[INPUT]', ...args)
  }
}

// Draw using raw SCREEN PIXELS ONLY
export function drawDot(x, y, color = 'red') {
  if (!DEBUG_INPUT.enabled) return

  const dot = document.createElement('div')
  dot.style.position = 'fixed'
  dot.style.left = `${x - 6}px`
  dot.style.top = `${y - 6}px`
  dot.style.width = '12px'
  dot.style.height = '12px'
  dot.style.borderRadius = '50%'
  dot.style.background = color
  dot.style.pointerEvents = 'none'
  dot.style.zIndex = '99999'

  document.body.appendChild(dot)
  setTimeout(() => dot.remove(), 500)
}

export function debugDown(x, y) {
  log('DOWN', x, y)
  drawDot(x, y, 'red')
}

export function debugMove(x, y) {
  log('MOVE', x, y)
  drawDot(x, y, 'orange')
}

export function debugUp(x, y) {
  log('UP', x, y)
  drawDot(x, y, 'lime')
}
