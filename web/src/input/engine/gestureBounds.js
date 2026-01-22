import {
  clampDelta2D,
  clampSwipe,
  shouldCommitSwipeBySize,
  shouldStartSwipeBySize
} from '../math/clampMath'

// Legacy wrapper maintained for compatibility while math lives in math/clampMath.js
export { clampSwipe, clampDelta2D, shouldStartSwipeBySize, shouldCommitSwipeBySize }
