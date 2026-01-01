//input/gestures/pressGesture.js
import { inputRegistry } from '../core/inputRegistry'
import { gestureBus } from '../bus/gestureBus'
import { debugLagTime, log } from '../debug/inputDebug'

export const pressGesture = {
  state: {
    fsmState: 'IDLE',
    pressCandidate: null
  },

  pointerDown(event) {
    debugLagTime('down')
    const { fsmState } = this.state
    if (fsmState !== 'IDLE') return

    const elements = document.elementsFromPoint(event.clientX, event.clientY)
    const pressCandidate = elements.find(el => inputRegistry.getPressCallbacks(el).size)
    if (!pressCandidate) return

    this.state.fsmState = 'PRESS_PENDING'
    this.state.pressCandidate = pressCandidate
    inputRegistry.getPressCallbacks(pressCandidate).forEach(fn => fn(event))
    gestureBus.emit({ type: 'pressStart', x: event.clientX, y: event.clientY })

    log('input', 'FSMDown', '→ PRESS_PENDING', pressCandidate)
  },

  pointerUp(event) {
    const { fsmState, pressCandidate } = this.state
    if (fsmState !== 'PRESS_PENDING' || !pressCandidate) return

    inputRegistry.getReleaseCallbacks(pressCandidate).forEach(fn => fn(event))
    gestureBus.emit({ type: 'pressEnd', x: event.clientX, y: event.clientY })
    this.reset()
  },

  pointerCancel() {
    this.reset()
  },

  reset() {
    this.state.fsmState = 'IDLE'
    this.state.pressCandidate = null
  }
}
