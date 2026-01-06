import { DEBUG } from './config'

// Universal log function that respects DEBUG settings.
export function log(key, ...args) {
  if (!DEBUG.enabled) return
  if (!DEBUG[key]) return

  const time = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })
  console.log(`[${time}] [${key}]`, ...args)
}

// Draw using raw screen pixels only.
export function drawDot(x, y, color = 'red') {
  if (DEBUG.enabled && DEBUG.drawDots) {
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

let timeList = []

// Track performance lag between gesture events.
export function debugLagTime(label) {
  if (!DEBUG.enabled || !DEBUG.lagTime) return

  if (label === 'log') {
    for (let i = 0; i < timeList.length - 1; i++) {
      const a = timeList[i]
      const b = timeList[i + 1]
      const delta = (b.t - a.t).toFixed(1)
      log('lagTime', `${a.label} -> ${b.label}: ${delta}ms`)
    }
    timeList = []
  } else {
    timeList.push({ label, t: performance.now() })
  }
}

const RAF_SAMPLE = 120
let rafHandle = null
let rafLast = 0
let rafCount = 0
let rafMin = Number.POSITIVE_INFINITY
let rafMax = 0
let rafSum = 0

// requestAnimationFrame delta logging. Controlled by DEBUG.rafDelta.
export function startRafDeltaDebug(label = 'rAF') {
  if (!DEBUG.enabled || !DEBUG.rafDelta) return
  if (rafHandle) return

  const tick = (now) => {
    if (!rafLast) {
      rafLast = now
      rafHandle = requestAnimationFrame(tick)
      return
    }

    const delta = now - rafLast
    rafLast = now

    rafMin = Math.min(rafMin, delta)
    rafMax = Math.max(rafMax, delta)
    rafSum += delta
    rafCount += 1

    if (DEBUG.lagTime) {
      debugLagTime(`${label} frame`)
      if (rafCount % RAF_SAMPLE === 0) debugLagTime('log')
    }

    if (rafCount % RAF_SAMPLE === 0) {
      const avg = rafSum / RAF_SAMPLE
      log('rafDelta', `${label} delta ${avg.toFixed(1)}ms avg, ${rafMin.toFixed(1)}ms min, ${rafMax.toFixed(1)}ms max over ${RAF_SAMPLE} frames`)
      rafMin = Number.POSITIVE_INFINITY
      rafMax = 0
      rafSum = 0
    }

    rafHandle = requestAnimationFrame(tick)
  }

  rafHandle = requestAnimationFrame(tick)
}

export function stopRafDeltaDebug() {
  if (rafHandle) {
    cancelAnimationFrame(rafHandle)
    rafHandle = null
  }

  if (DEBUG.enabled && DEBUG.rafDelta && rafCount > 0) {
    const avg = rafSum / rafCount
    log('rafDelta', `stop ${rafCount}f avg=${avg.toFixed(1)}ms min=${rafMin.toFixed(1)}ms max=${rafMax.toFixed(1)}ms`)
  }

  if (DEBUG.lagTime) debugLagTime('log')

  rafLast = 0
  rafCount = 0
  rafMin = Number.POSITIVE_INFINITY
  rafMax = 0
  rafSum = 0
}
