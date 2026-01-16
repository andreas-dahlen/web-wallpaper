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
import { log } from '../../debug/functions'

function forward(descriptor) {
    if (!descriptor) return

    if (Array.isArray(descriptor)) {
        for (const d of descriptor) forward(d)
        return
    }

    if (!descriptor.type) {
        console.warn('Invalid reaction descriptor', descriptor)
        return
    }

    renderer.handleReaction(descriptor)
}


export const engineAdapter = {
    onPress(x, y) {
        forward(reactionResolver.onPress(x, y))
        log('adapter', '[POINTER-PRESSED]')
    },

    onSwipeStart(x, y, axis) {
        const descriptor = reactionResolver.onSwipeStart(x, y, axis)
        forward(descriptor)
        log('adapter', '[SWIPE-START]')
        return !!descriptor
    },

    onSwipe(intent) {
        forward(reactionResolver.onSwipe(intent))
    },

    onSwipeCommit(intent) {
        forward(reactionResolver.onSwipeCommit(intent))
        log('adapter', '[SWIPE-COMMIT]')
    },

    onSwipeRevert() {
        forward(reactionResolver.onSwipeRevert())
        log('adapter', '[SWIPE-REVERT]')
    },

    // Pointer-up commit when no swipe
    onPressRelease(intent) {
        forward(reactionResolver.onPressRelease(intent))
        log('adapter', '[POINTER-RELEASED]')
    },

    onPressCancel(intent) {
        forward(intent)
        log('adapter', '[PRESS-CANCEL]')
    },

    shouldStartSwipe(delta, axis) {
        return reactionResolver.shouldStartSwipe(delta, axis)
    },

    shouldCommitSwipe(delta, axis) {
        return reactionResolver.shouldCommitSwipe(delta, axis)
    },

    shouldRevertSwipe() {
        return reactionResolver.shouldRevertSwipe()
    }
}

