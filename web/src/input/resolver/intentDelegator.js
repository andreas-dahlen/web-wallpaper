//intentDelegator.js

import { resolve } from './resolver'
import { buildPayload } from './buildPayload'

const localMemory = {
  target: null,

  get() { return { target: this.target } },
  set(solution) { if (solution.target) this.target = solution.target },
  reset() { this.target = null }
}

//COULD DO RESETSWIPE AND RESETPRESS INTEAD OF RESETSTATE
export const intentDelegate = {

  onPress(intent) {
    const solution = resolve.press(intent)
    if (!solution) return null
    localMemory.set(solution)
    return buildPayload(solution, intent.type)
  },

  onSwipeStart(intent) {
    const facts = localMemory.get()
    const solution = resolve.swipeStart(intent, facts)
    if (!solution) return null
    if (!localMemory.target || solution.target !== localMemory.target) {
      localMemory.set(solution)
    }
    return buildPayload(solution, intent.type)
  },

  onSwipe(intent) {
    const facts = localMemory.get()
    const solution = resolve.swipe(intent, facts)
    if (!solution) return null
    return buildPayload(solution, intent.type)
  },

  onSwipeEnd(intent) {
    const facts = localMemory.get()
    const solution = resolve.swipeEnd(intent, facts)
    if (!solution) return null
    localMemory.reset()
    return buildPayload(solution, intent.type)
  },

  onPressRelease(intent) {
    const facts = localMemory.get()
    const solution = resolve.pressRelease(intent, facts)
    if (!solution) return null
    localMemory.reset()
    return buildPayload(solution, intent.type)
  }
}