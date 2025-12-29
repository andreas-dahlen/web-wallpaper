import { DEBUG } from '../config/appSettings'

function debugOn(group, key) {
  if (!DEBUG.enabled) return false
  return Boolean(DEBUG[group]?.enabled && DEBUG[group]?.[key])
}

export function log(group, key, ...args) {
    if (debugOn(group, key)) {
        console.log(`[${group}:${key}]`, ...args)
    }
}

// Draw using raw SCREEN PIXELS ONLY
function drawDot(x, y, color = 'red') {
    if (debugOn('input', 'dots') === true) {
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
}

export function debugDown(x, y) {
    if (debugOn('input', 'dots')) drawDot(x, y, 'red')
    if (debugOn('input', 'logDots')) log('input', 'logDots', 'DOWN', x, y)
}

export function debugMove(x, y) {
    if (debugOn('input', 'dots')) drawDot(x, y, 'orange')
    if (debugOn('input', 'logDots')) log('input', 'logDots', 'MOVE', x, y)
}

export function debugUp(x, y) {
    if (debugOn('input', 'dots')) drawDot(x, y, 'lime')
    if (debugOn('input', 'logDots')) log('input', 'logDots', 'UP', x, y)
}