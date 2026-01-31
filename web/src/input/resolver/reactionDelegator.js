//reactionDelegator.js

import { resolve } from './resolver'
import { buildPayload } from '../render/buildPayload'

const localMemory = {
  currentTarget: null,
  previousTarget: null,

  get() {
    return {
      currentTarget: this.currentTarget,
      previousTarget: this.previousTarget,
    }
  },
  set(solution) {
    if (solution.target) {
      this.previousTarget = this.currentTarget
      this.currentTarget = solution.target
    }
  },
  reset() {
    this.currentTarget = null
    this.previousTarget = null
  },
  supportsIntent(intentType) {
    return this.currentTarget?.reactions?.[intentType]
  }
}

//COULD DO RESETSWIPE AND RESETPRESS INTEAD OF RESETSTATE
export const reactionDelegate = {

  onPress(intent) {
    const solution = resolve.pressElement(intent)
    if (!solution) return null
    localMemory.set(solution)
    return buildPayload(localMemory.get(), solution)
  },

  onSwipeStart(intent) {
    const facts = localMemory.get()
    const solution = resolve.swipeElement(intent, facts)
    if (!solution) return null
    localMemory.set(solution)
    return buildPayload(localMemory.get(), solution)
  },

  onSwipe(intent) {
    const facts = localMemory.get()
    if (!localMemory.supportsIntent('swipe')) return null
    const solution = resolve.canSwipe(intent, facts)
    if (!solution) return null
    return buildPayload(localMemory.get(), solution)
  },

  onSwipeEnd(intent) {
    const facts = localMemory.get()
    if (!localMemory.supportsIntent('swipeEnd')) return null
    const solution = resolve.canSwipeEnd(intent, facts)
    if (!solution) return null
    localMemory.reset()
    return buildPayload(facts, solution)
  },

  onPressRelease(intent) {
    const facts = localMemory.get()
    if (!localMemory.supportsIntent('pressRelease')) return null
    const solution = resolve.canPressRelease(intent, facts)
    if (!solution) return null
    localMemory.reset()
    return buildPayload(facts, solution)
  }
}