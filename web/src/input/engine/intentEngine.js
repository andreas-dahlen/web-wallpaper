/**
 * intentEngine.js - Input intent state machine (JS)
 *
 * Responsibilities:
 * - Accept raw input (down, move, up)
 * - Maintain pointer state
 * - Detect intent (press/release, swipe axis + direction)
 *
 * Rules:
 * - MUST NOT touch DOM
 * - MUST NOT know about lanes, components, or animations
 * - MUST NOT trigger CSS or renderer directly
 *
 * Output Contract (to adapter):
 *   - press: on pointer down
 *   - release: pointer up without swipe commit
 *   - swipe-start / swipe / swipe-end / cancel via adapter callbacks
 *
 * Notes:
 * - Only numeric deltas are tracked internally (`totalDelta`)
 * - Absolute positions are **not emitted**; raw pointer coords are passed for reference
 * - Drag raw deltas attached via gestureState/resolver only
 */

import { log, drawDots } from '../../debug/functions'
import { engineAdapter } from './engineAdapter'

// Gesture state (no DOM refs)
const state = {
    phase: 'IDLE',        // lifecycle of the gesture recognizer
    startX: 0,            // pointer position at press
    startY: 0,
    lastX: 0,
    lastY: 0,            // pointer position at press
    mode: null,           // 'horizontal' | 'vertical' | 'both'
    totalDelta: {
        x: 0,
        y: 0
    }   // total accumulated movement {x, y}
}

export const intentEngine = {
    onDown,
    onMove,
    onUp,
    getState: () => ({ ...state })
}

function onDown(x, y) {
    drawDots(x, y, 'green')
    log('input', `[@DOWN] X = ${x} Y = ${y}`)

    state.phase = 'PENDING'
    state.startX = x
    state.startY = y
    state.lastX = x
    state.lastY = y
    state.mode = null
    state.totalDelta.x = 0
    state.totalDelta.y = 0

    // Inform adapter of press/target resolution
    engineAdapter.onPress({ x, y })
}

function onMove(x, y) {
    if (state.phase === 'IDLE') return

    drawDots(x, y, 'yellow')
    const deltaX = x - (state.lastX ?? state.startX)
    const deltaY = y - (state.lastY ?? state.startY)
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Detect swipe axis
    if (state.phase === 'PENDING') {
        const lockedAxis = absX > absY ? 'horizontal' : 'vertical'
        const result = engineAdapter.onSwipeStart({ x, y, lockedAxis })
        if (result.accepted) {
            state.phase = 'SWIPING'
            state.mode = result.mode
            log('input', '[ACCEPTED] Swipe by adapter', result)
            log('swipe', 'Swiping started, mode:', state.mode)
        } else {
            log('input', '[PENDING] Swipe not yet accepted', result)
            // log('input', deltaX, deltaY)
        }
    }
    // Track swipe delta on locked axis
    if (state.phase === 'SWIPING') {
        deltaX = x - (state.lastX ?? state.startX)
        deltaY = y - (state.lastY ?? state.startY)

        state.lastX = x
        state.lastY = y

        if (state.mode === 'horizontal') {
            state.totalDelta.x += deltaX
        } else if (state.mode === 'vertical') {
            state.totalDelta.y += deltaY
        } else if (state.mode === 'both') {
            state.totalDelta.x += deltaX
            state.totalDelta.y += deltaY
        }

        engineAdapter.onSwipe({
            type: 'swipe',
            mode: state.mode,
            totalDelta: state.totalDelta
        })
    }
}

function onUp() {
    if (state.phase !== 'SWIPING' && state.phase !== 'PENDING') {
        log('init', 'state.phase error: ', state.phase)
        state.phase = 'IDLE'
        state.mode = null
        state.lastX = null
        state.lastY = null
        return
    }
    if (state.phase === 'SWIPING')
        engineAdapter.onSwipeEnd({
            type: 'swipe-end',
            mode: state.mode,
            totalDelta: state.totalDelta
        })

    else if (state.phase === 'PENDING') {
        // Pointer up without swipe → release
        engineAdapter.onPressRelease({
            type: 'pressRelease',
            x: state.startX,
            y: state.startY
        })
    }
    state.phase = 'IDLE'
    state.mode = null
    state.lastX = null
    state.lastY = null
}

// function getSwipeDirection(axis, delta) {
//     if (axis === 'horizontal') {
//         return delta > 0 ? 'right' : 'left'
//     }
//     return delta > 0 ? 'down' : 'up'
// }
//DEPRECATED FUCNTION. WILL BE MOVED BASICALLY...