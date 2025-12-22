// input/debugInput.js

export const DEBUG_INPUT = {
  enabled: true,       // Visual dots
  log: false,          // Console logs
  useNormalized: false  // true → 364x800 normalized, false → raw screen pixels
}

function log(...args) {
  if (DEBUG_INPUT.log) {
    console.log('[INPUT]', ...args)
  }
}

// Draw using raw SCREEN PIXELS
export function drawScreenDot(x, y, color = 'red') {
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

// Draw using NORMALIZED coordinates (364×800 → screen)
export function drawNormalizedDot(normX, normY, color = 'red') {
  if (!DEBUG_INPUT.enabled) return

  const appEl = document.getElementById('app')
  if (!appEl) return

  const rect = appEl.getBoundingClientRect()

  const screenX = rect.left + (normX / 364) * rect.width
  const screenY = rect.top + (normY / 800) * rect.height

  drawScreenDot(screenX, screenY, color)
}

// --- Debug helpers ---
export function debugDown(x, y) {
  const normalized = DEBUG_INPUT.useNormalized
  log('DOWN', x, y)
  normalized ? drawNormalizedDot(x, y, 'red') : drawScreenDot(x, y, 'red')
}

export function debugMove(x, y) {
  const normalized = DEBUG_INPUT.useNormalized
  log('MOVE', x, y)
  normalized ? drawNormalizedDot(x, y, 'orange') : drawScreenDot(x, y, 'orange')
}

export function debugUp(x, y) {
  const normalized = DEBUG_INPUT.useNormalized
  log('UP', x, y)
  normalized ? drawNormalizedDot(x, y, 'lime') : drawScreenDot(x, y, 'lime')
}
