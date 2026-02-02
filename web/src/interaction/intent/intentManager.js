//intentDelegator.js

import { resolve } from './intentResolver'
import { buildPayload } from './buildPayload'

const localMemory = {
  target: null,
  axis: null,
  swipeType: null,

  get() {
    return { target: this.target, axis: this.axis, swipeType: this.swipeType }
  },
  set(target) {
    if (!target || target === this.target) return
    this.target = target
    this.axis = target.axis ?? null
    this.swipeType = target.swipeType ?? null
  },
  reset() {
    this.target = null;
    this.axis = null;
    this.swipeType = null
  }
}

//COULD DO RESETSWIPE AND RESETPRESS INTEAD OF RESETSTATE
export const intentDelegate = {

  onPress(intent) {
    const solution = resolve.press(intent)
    if (!solution) return null
    localMemory.set(solution.target)
    return buildPayload(solution)
  },

  onSwipeStart(intent) {
    const facts = localMemory.get()
    const solution = resolve.swipeStart(intent, facts)
    if (!solution) return null
    if (!localMemory.target || solution.target !== localMemory.target) {
      localMemory.set(solution.target)
    }
    return buildPayload(solution)
  },

  onSwipe(intent) {
    const facts = localMemory.get()
    const solution = resolve.swipe(intent, facts)
    if (!solution) return null
    return buildPayload(solution)
  },

  onSwipeCommit(intent) {
    const facts = localMemory.get()
    const solution = resolve.swipeCommit(intent, facts)
    if (!solution) return null
    localMemory.reset()
    return buildPayload(solution)
  },

  onPressRelease(intent) {
    const facts = localMemory.get()
    const solution = resolve.pressRelease(intent, facts)
    if (!solution) return null
    localMemory.reset()
    return buildPayload(solution)
  }
}