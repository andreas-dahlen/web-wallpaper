//input/gestures/swipeGesture.js
import { inputRegistry } from '../core/inputRegistry'
import { gestureBus } from '../bus/gestureBus'
import { log } from '../debug/inputDebug'

export const swipeGesture = {
  state: {
    fsmState: 'IDLE',
    swipeCandidate: null,
    swipeAxis: null,
    swipeAccum: 0,
    swipeStarted: false,
    start: { x: 0, y: 0 },
    last: { x: 0, y: 0 }
  },

  pointerMove(event) {
    const s = this.state
    if (s.fsmState !== 'SWIPING') return

    const stepDelta = s.swipeAxis === 'horizontal'
      ? event.clientX - s.last.x
      : event.clientY - s.last.y

    s.swipeAccum += stepDelta

    if (!s.swipeStarted) {
      const cfg = inputRegistry.getSwipeConfig(s.swipeCandidate)
      cfg?.handlers?.onSwipeStart?.({ el: s.swipeCandidate, axis: s.swipeAxis })
      gestureBus.emit({ type: 'swipeStart', el: s.swipeCandidate, axis: s.swipeAxis })
      s.swipeStarted = true
      log('input', 'FSMMove', '🌟 SWIPE START', s.swipeAxis)
    }

    const cfg = inputRegistry.getSwipeConfig(s.swipeCandidate)
    const dirMap = {
      horizontal: stepDelta > 0 ? 'right' : 'left',
      vertical: stepDelta > 0 ? 'down' : 'up'
    }
    const dir = dirMap[s.swipeAxis]
    cfg?.handlers[dir]?.({ el: s.swipeCandidate, delta: stepDelta, total: s.swipeAccum })
    gestureBus.emit({ type: 'swipeMove', axis: s.swipeAxis, delta: stepDelta, total: s.swipeAccum })

    if (s.swipeAxis === 'horizontal') s.last.x = event.clientX
    else s.last.y = event.clientY
  },

  pointerStart(event) {
    const elements = document.elementsFromPoint(event.clientX, event.clientY)
    const swipeCandidate = elements.find(el => inputRegistry.getSwipeConfig(el))
    if (!swipeCandidate) return

    const s = this.state
    s.fsmState = 'SWIPING'
    s.swipeCandidate = swipeCandidate
    s.swipeAxis = null
    s.swipeAccum = 0
    s.swipeStarted = false
    s.start.x = s.last.x = event.clientX
    s.start.y = s.last.y = event.clientY
  },

  pointerEnd(event) {
    const s = this.state
    if (!s.swipeCandidate) return

    const cfg = inputRegistry.getSwipeConfig(s.swipeCandidate)
    cfg?.handlers?.onSwipeRelease?.({ el: s.swipeCandidate, total: s.swipeAccum })
    gestureBus.emit({ type: 'swipeEnd', axis: s.swipeAxis, total: s.swipeAccum })
    this.reset()
  },

  reset() {
    const s = this.state
    s.fsmState = 'IDLE'
    s.swipeCandidate = null
    s.swipeAxis = null
    s.swipeAccum = 0
    s.swipeStarted = false
    s.start.x = s.start.y = 0
    s.last.x = s.last.y = 0
  }
}
