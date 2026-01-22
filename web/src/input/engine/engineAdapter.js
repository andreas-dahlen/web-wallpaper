/**
 * engineAdapter.js - Intent Bridge (updated)
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
    onPress(intent) {
        forward(reactionResolver.onPress(intent))
        log('adapter', '[POINTER-PRESSED]', intent)
    },

onSwipeStart(intent) {
    const result = reactionResolver.onSwipeStart(intent) || {
        reactions: null,
        intent: { accepted: false, mode: null }
    }
    console.log(result)
    forward(result.reactions)
    log('adapter', '[SWIPE-START]', intent)
    return result.intent
},

    onSwipe(intent) {
        forward(reactionResolver.onSwipe(intent))
        log('adapter', '[SWIPE]', intent)
    },

    onSwipeEnd(intent) {
        forward(reactionResolver.onSwipeEnd(intent))
        log('adapter', '[SWIPE-END]', intent)
    },

    onPressRelease(intent) {
        forward(reactionResolver.onPressRelease(intent))
        log('adapter', '[POINTER-RELEASED]', intent)
    }
}