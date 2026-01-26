 //reactionDelegator.js

import { cycleState } from '../state/cycleState'
import { resolve } from './resolver'


//COULD DO RESETSWIPE AND RESETPRESS INTEAD OF RESETSTATE
export const reactionDelegate = {
  onPress(intent) {
    if (!cycleState.checkPressElegibility(intent.type)) {
      cycleState.resetState()
      return { reaction: null }
    }
    const solution = resolve.pressElement(intent)
    if (!solution) {
      cycleState.resetState()
      return { reaction: null }
    }
    cycleState.activePress(solution)
    return { reaction: solution || null }
  },

  onSwipeStart(intent) {
    if (!cycleState.checkSwipeStartElegibility(intent.type)) {
      cycleState.resetState()
      return { reaction: null, control: { accepted: false, lockAxis: false } }
    }

    const facts = cycleState.getFacts()
    const result = resolve.swipeElement(intent, facts) || resolve.backupSwipeElement(intent, facts)
    if (!result) return { reaction: null, control: { accepted: false, lockAxis: false } }

    cycleState.activeSwipeStart(result)

    let solution
    if (result.old) {
      solution = [result.reaction || null, result.old.reaction || null]
    } else {
      solution = result.reaction || null
    }
    return { reaction: solution, control: solution.control || null }
  },

  onSwipe(intent) {
    if (!cycleState.checkSwipeElegibility(intent.type)) {
      cycleState.resetState()
      return { reaction: null }
    }
    const facts = cycleState.getFacts()
    const solution = resolve.swipe(intent, facts)
    if (!solution) {
      cycleState.resetState()
      return { reaction: null }
    }
    cycleState.activeSwipe(solution)
    return { reaction: solution || null }
  },

  onSwipeEnd(intent) {
    if (!cycleState.checkSwipeEndElegibility(intent.type)) {
      cycleState.resetState()
      return { reaction: null }
    }
    const facts = cycleState.getFacts()
    const solution = resolve.swipeEnd(intent, facts)
    if (!solution) {
      cycleState.resetState()
      return { reaction: null }
    }
    cycleState.activeSwipeEnd(solution)
    return { reaction: solution || null }
  },

  onPressRelease(intent) {
    if (!cycleState.checkPressReleaseElegibility(intent.type)) {
      cycleState.resetState()
      return { reaction: null }
    }
    const facts = cycleState.getFacts()
    const solution = resolve.pressRelease(intent, facts)
    if (!solution) {
      cycleState.resetState()
      return { reaction: null }
    }
    cycleState.activePressRelease(solution) //could do cycleState.resetState() not sure...
    return { reaction: solution || null }
  }
}