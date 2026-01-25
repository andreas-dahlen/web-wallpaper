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
import { intentForward } from './intentForwarder'
import { swipeThresholdCalc } from '../math/clampMath'

// Gesture state (no DOM refs)
const state = {
    phase: 'IDLE',            // gesture lifecycle
    start: { x: 0, y: 0 },    // initial pointer down
    last: { x: 0, y: 0 },     // last pointer position
    lockAxis: false,           // true if swipe locked
    activeAxis: 'both',              // horizontal / vertical / both
    totalDelta: { x: 0, y: 0 } // accumulated delta
}

export const intentMap = {
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
    state.activeAxis = 'both'
    state.totalDelta.x = 0
    state.totalDelta.y = 0

    // Inform adapter of press/target resolution
    intentForward.onPress({
        type: 'press',
        delta: { x: x, y: y }
    })
}

function onMove(x, y) {
    if (state.phase === 'IDLE') return

    drawDots(x, y, 'yellow')


    // Compute deltas
    const startDeltaX = x - (state.start.x)
    const startDeltaY = y - (state.start.y)
    const absX = Math.abs(startDeltaX)
    const absY = Math.abs(startDeltaY)
    const biggest = absX > absY ? absX : absY
    if (state.phase === 'PENDING') {
        if (swipeThresholdCalc(biggest)) {
            const estimatedAxis = absX > absY ? 'horizontal' : 'vertical'
            const { accepted, lockAxis } =
                intentForward.onSwipeStart({
                    type: 'swipe-start',
                    delta: { x: x, y: y },
                    axis: estimatedAxis
                })

            if (accepted) {
                state.phase = 'SWIPING'
                state.lockAxis = lockAxis
                state.activeAxis = state.lockAxis ? estimatedAxis : 'both'
            } else {
                // log('input', '[PENDING] Swipe not yet accepted', { x, y, proposedAxis })
            }
        }
    }

    // Track swipe delta
    if (state.phase === 'SWIPING') {

        const deltaX = x - state.last.x
        const deltaY = y - state.last.y
        if (state.activeAxis === 'horizontal') {
            state.totalDelta.x += deltaX
        } else if (state.activeAxis === 'vertical') {
            state.totalDelta.y += deltaY
        } else if (state.activeAxis === 'both') {
            state.totalDelta.x += deltaX
            state.totalDelta.y += deltaY
        }

        intentForward.onSwipe({
            type: 'swipe',
            axis: state.activeAxis,
            delta: shapeDeltaForActiveAxis(state.activeAxis, state.totalDelta)
        })
        state.last.x = x
        state.last.y = y
    }
}

function onUp(x, y) {
    if (state.phase !== 'SWIPING' && state.phase !== 'PENDING') {
        log('init', 'state.phase error: ', state.phase)
        resetState()
        return
    }
    if (state.phase === 'SWIPING')
        intentForward.onSwipeEnd({
            type: 'swipe-end',
            axis: state.activeAxis,
            delta: shapeDeltaForActiveAxis(state.activeAxis, state.totalDelta)
        })

    else if (state.phase === 'PENDING') {
        // Pointer up without swipe → release
        intentForward.onPressRelease({
            type: 'pressRelease',
            delta: { x: x, y: y }
        })
    }
    resetState()
}

// Helper: reset all gesture state
function resetState() {
    state.phase = 'IDLE'
    state.lockAxis = false
    state.activeAxis = 'both'
    state.start.x = 0
    state.start.y = 0
    state.last.x = 0
    state.last.y = 0
    state.totalDelta.x = 0
    state.totalDelta.y = 0
}

function shapeDeltaForActiveAxis(activeAxis, totalDelta) {
    switch (activeAxis) {
        case 'horizontal': return { x: totalDelta.x }
        case 'vertical': return { y: totalDelta.y }
        default: return { ...totalDelta }
    }
}