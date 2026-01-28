//reactionDelegator.js

import { descriptorBuilder } from '../render/descriptorBuild'
import { cycleState } from '../state/cycleState'
import { resolve } from './resolver'


//COULD DO RESETSWIPE AND RESETPRESS INTEAD OF RESETSTATE
export const reactionDelegate = {
  onPress(intent) {
    if (!cycleState.checkPressElegibility(intent.type)) {
      cycleState.resetState()
      return null
    }
    const result = resolve.pressElement(intent)
    if (!result) {
      cycleState.resetState()
      return null
    }
    cycleState.setCycle(result)
    const resolvedFacts = cycleState.getFacts()
    return descriptorBuilder.build(intent, resolvedFacts)
  },

  onSwipeStart(intent) {
    if (!cycleState.checkSwipeStartElegibility(intent.type)) {
      cycleState.resetState()
      return null
      //this also has accepted false implicit?
    }

    const facts = cycleState.getFacts()
    const result = resolve.swipeElement(intent, facts) || resolve.backupSwipeElement(intent, facts)
    if (!result) return null
    //this also has accepted false implicit?

    cycleState.setCycle(result)
    const resolvedFacts = cycleState.getFacts()
    return descriptorBuilder.build(intent, resolvedFacts)
  },

  onSwipe(intent) {
    if (!cycleState.checkSwipeElegibility(intent.type)) {
      cycleState.resetState()
      return null
    }
    const facts = cycleState.getFacts()
    const result = resolve.canSwipe(intent, facts)
    if (!result) {
      cycleState.resetState()
      return null
    }
    cycleState.setCycle(result)
    const resolvedFacts = cycleState.getFacts()
    return descriptorBuilder.build(intent, resolvedFacts)
  },

  onSwipeEnd(intent) {
    if (!cycleState.checkSwipeEndElegibility(intent.type)) {
      cycleState.resetState()
      return null
    }
    const facts = cycleState.getFacts()
    const result = resolve.canSwipeEnd(intent, facts)
    if (!result) {
      cycleState.resetState()
      return null
    }
    cycleState.setCycle(result)
    const resolvedFacts = cycleState.getFacts()
    return descriptorBuilder.build(intent, resolvedFacts)
  },

  onPressRelease(intent) {
    if (!cycleState.checkPressReleaseElegibility(intent.type)) {
      cycleState.resetState()
      return null
    }
    const facts = cycleState.getFacts()
    const result = resolve.canPressRelease(intent, facts)
    if (!result) {
      cycleState.resetState()
      return null
    }
    cycleState.setCycle(result)
    const resolvedFacts = cycleState.getFacts()
    return descriptorBuilder.build(intent, resolvedFacts)
  }
}