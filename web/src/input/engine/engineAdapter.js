/**
 * engineAdapter.js - Intent Bridge
 *
 * Responsibilities:
 * - Receive intent from intentEngine
 * - Forward reaction descriptors to renderer
 *
 * Rules:
 * - No platform branching
 * - No DOM access
 * - No animation logic
 */

import { renderer } from '../render/renderer'
import { reactionResolver } from '../render/reactionResolver'

function forward(descriptor) {
    if (!descriptor) return
    renderer.handleReaction(descriptor)
}

export const engineAdapter = {
    onGestureStart(x, y) {
        forward(reactionResolver.onStart(x, y))
    },

    onSwipeStart(x, y, axis) {
        const descriptor = reactionResolver.onSwipeStart(x, y, axis)
        forward(descriptor)
        return !!descriptor
    },

    onDrag(intent) {
        forward(reactionResolver.onDrag(intent))
    },

    onSwipeEnd(intent) {
        forward(reactionResolver.onSwipeEnd(intent))
    },

    onSwipeCancel() {
        forward(reactionResolver.onSwipeCancel())
    },

    // Pointer-up commit when no swipe
    onRelease(intent) {
        forward(reactionResolver.onRelease(intent))
    },
    
    shouldStartSwipe(delta, axis) {
        return reactionResolver.shouldStartSwipe(delta, axis)
    },

    shouldCommitSwipe(delta, axis) {
        return reactionResolver.shouldCommitSwipe(delta, axis)
    }
}

