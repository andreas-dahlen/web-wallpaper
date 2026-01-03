import { DEBUG } from '../../config/appSettings'

export function log(key, ...args) {
    if (!DEBUG.enabled) return

    if (DEBUG[key]) {
        const time = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            fractionalSecondDigits: 3 
        })
        console.log(`[${time}] [DEBUG:${key}]`, ...args)
    }
}

// Draw using raw SCREEN PIXELS ONLY
export function drawDot(x, y, color = 'red') {
    if (DEBUG.enabled && DEBUG['drawDots']) {
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

export function debugLagTime(label) {
    if (!DEBUG.enabled || !DEBUG['debugLagTime']) return

    if (label === 'log') {
        for (let i = 0; i < timeList.length - 1; i++) {
            const a = timeList[i]
            const b = timeList[i + 1]
            console.log(
                `[LAG] ${a.label} → ${b.label}: ${(b.t - a.t).toFixed(2)} ms`
            )
        }
        timeList = []
    } else {
        timeList.push({ label, t: performance.now() })
    }
}
