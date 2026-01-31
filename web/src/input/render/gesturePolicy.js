import { domRegistry } from "../dom/domRegistry"

//gesturePolicy.js
export const policy = {

  resolveSupports(type, target) {
    return !!target?.reactions?.[type]
  },

  resolveDeltaLock(delta, axis) {
    if (!delta || !axis) return delta
    if (axis === 'both') { return { x: delta.x, y: delta.y } }
    if (axis === 'horizontal') { return { x: delta.x, y: 0 } }
    if (axis === 'vertical') { return { x: 0, y: delta.y } }
    return delta
  },
  /**
   * Returns: 'horizontal' | 'vertical' | 'both' | null
   */
  resolveAxis(intentAxis, target) {
    if (!target?.axis) return null

    // Target accepts both → use intent axis
    if (target.axis === 'both') {
      return intentAxis
    }

    // Target is strict → must match intent
    if (target.axis === intentAxis) {
      return intentAxis
    }

    // Axis not supported
    return null
  },

  resolveTarget(intent) {
    const target = domRegistry.findElementAt(intent.delta.x, intent.delta.y)
    if (target && this.resolveSupports(intent.type, target)) {
      return target
    }
    return null
  },

  resolveSwipeTarget(intent, facts) {
    // Priority: currentTarget must support swipeStart AND the intent axis
    if (facts.currentTarget) {
      const axis = this.resolveAxis(intent.axis, facts.currentTarget)
      if (this.resolveSupports('swipeStart', facts.currentTarget) && axis) {
        console.log('origonal: ', facts.currentTarget)
        return {
          target: facts.currentTarget,
          axis,
          pressCancel: false
        }
      }
    }

    // Fallback: find lane by axis
    const newTarget = domRegistry.findLaneByAxis(intent.delta.x, intent.delta.y, intent.axis)
    if (newTarget) {
      console.log('backup: ', newTarget)
      return {
        target: newTarget,
        axis: newTarget.axis, // might still be 'both'
        pressCancel: this.resolveSupports('pressCancel', facts.currentTarget)
      }
    }

    return null
  }
}


