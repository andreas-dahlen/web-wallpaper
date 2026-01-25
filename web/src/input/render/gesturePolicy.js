//gesturePolicy.js

export function supports(type, target) {
  return !!target?.reactions?.[type]
}

export function shouldLockAxis(target) {
  if (!target) return false
  return target?.swipeType !== 'drag'
}

/**
 * Resolve the effective axis for this gesture.
 * Returns: 'horizontal' | 'vertical' | 'both' | null
 */
export function resolveAxis(intentAxis, target) {
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
}
