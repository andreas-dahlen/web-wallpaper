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

const gestureState = {
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    swipeType: null
}

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
        gestureState.active = false
        forward(reactionResolver.onPress(x, y))
        log('adapter', '[POINTER-PRESSED]')
    },

    onSwipeStart(x, y, axis) {
        const descriptor = reactionResolver.onSwipeStart(x, y, axis)
        forward(descriptor)
        if (descriptor && descriptor.type === 'swipeStart') {
            gestureState.active = true
            gestureState.startX = x
            gestureState.startY = y
            gestureState.lastX = x
            gestureState.lastY = y
            gestureState.swipeType = descriptor.swipeType || null
        }
        log('adapter', '[SWIPE-START]')
        return !!descriptor
    },

    onSwipe(intent) {
        const payload = { ...intent }
        if (gestureState.active && (gestureState.swipeType === 'drag' || gestureState.swipeType === 'drag-and-drop' || gestureState.swipeType === 'dragAndDrop')) {
            payload.rawDelta = {
                x: intent.x - gestureState.startX,
                y: intent.y - gestureState.startY
            }
            gestureState.lastX = intent.x
            gestureState.lastY = intent.y
        }
        forward(reactionResolver.onSwipe(payload))
    },

    onSwipeCommit(intent) {
        const payload = { ...intent }
        if (gestureState.active && (gestureState.swipeType === 'drag' || gestureState.swipeType === 'drag-and-drop' || gestureState.swipeType === 'dragAndDrop')) {
            payload.rawDelta = {
                x: payload.x - gestureState.startX,
                y: payload.y - gestureState.startY
            }
        }
        forward(reactionResolver.onSwipeCommit(payload))
        gestureState.active = false
        log('adapter', '[SWIPE-COMMIT]')
    },

    onSwipeRevert() {
        forward(reactionResolver.onSwipeRevert())
        gestureState.active = false
        log('adapter', '[SWIPE-REVERT]')
    },

    // Pointer-up commit when no swipe
    onPressRelease(intent) {
        forward(reactionResolver.onPressRelease(intent))
        gestureState.active = false
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

