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
import { swipeThresholdCalc } from '../math/clampMath'

// Gesture state (no DOM refs)
const state = {
    phase: 'IDLE',            // gesture lifecycle
    start: { x: 0, y: 0 },    // initial pointer down
    last: { x: 0, y: 0 },     // last pointer position
    lockAxis: false,           // true if swipe locked
    mode: 'both',              // horizontal / vertical / both
    totalDelta: { x: 0, y: 0 } // accumulated delta
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
    state.start.x = x
    state.start.y = y
    state.last.x = x
    state.last.y = y
    state.lockAxis = false
    state.mode = 'both'
    state.totalDelta.x = 0
    state.totalDelta.y = 0

    // Inform adapter of press/target resolution
    engineAdapter.onPress({ x, y })
}

function onMove(x, y) {
    if (state.phase === 'IDLE') return

    drawDots(x, y, 'yellow')

    // Compute deltas
    const deltaX = x - (state.last.x ?? state.start.x)
    const deltaY = y - (state.last.y ?? state.start.y)
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const biggest = absX > absY ? absX : absY
    if (state.phase === 'PENDING') {
        if (swipeThresholdCalc(biggest)) {
            const proposedAxis = absX > absY ? 'horizontal' : 'vertical'
            const { accepted, lockAxis } = engineAdapter.onSwipeStart({ x, y, proposedAxis })
            log('input', 'accepted: ', accepted, 'lockAxis: ', lockAxis)
            if (accepted) {
                state.phase = 'SWIPING'
                state.lockAxis = lockAxis
                state.mode = lockAxis ? proposedAxis : 'both'
                log('input', '[ACCEPTED] Swipe by adapter', { x, y, proposedAxis, lockAxis })
                log('swipe', 'Swiping started, mode:', state.mode)
            } else {
                // log('input', '[PENDING] Swipe not yet accepted', { x, y, proposedAxis })
            }
        }
    }

    // Track swipe delta
    if (state.phase === 'SWIPING') {

        state.last.x = x
        state.last.y = y

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
            axis: state.mode,
            delta: shapeDeltaForMode(state.mode, state.totalDelta)
        })
    }
}

function onUp(x, y) {
    if (state.phase !== 'SWIPING' && state.phase !== 'PENDING') {
        log('init', 'state.phase error: ', state.phase)
        resetState()
        return
    }
    if (state.phase === 'SWIPING')
        engineAdapter.onSwipeEnd({
            type: 'swipe-end',
            axis: state.mode,
            delta: shapeDeltaForMode(state.mode, state.totalDelta)
        })

    else if (state.phase === 'PENDING') {
        // Pointer up without swipe → release
        engineAdapter.onPressRelease({
            type: 'pressRelease',
            x: x,
            y: y
        })
    }
    resetState()
}

// Helper: reset all gesture state
function resetState() {
    state.phase = 'IDLE'
    state.lockAxis = false
    state.mode = null
    state.last.x = null
    state.last.y = null
    state.totalDelta.x = 0
    state.totalDelta.y = 0
}

function shapeDeltaForMode(mode, totalDelta) {
    if (mode === 'horizontal') return totalDelta.x
    if (mode === 'vertical') return totalDelta.y
    return { x: totalDelta.x, y: totalDelta.y }
}