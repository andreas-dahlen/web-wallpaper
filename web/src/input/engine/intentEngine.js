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
    phase: 'IDLE', // 'IDLE' | 'PENDING' | 'SWIPING'
    startX: 0,
    startY: 0,
    lastAxisPos: 0,
    axis: null, // 'horizontal' | 'vertical' | null
    totalDelta: 0,
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
    state.lastAxisPos = 0
    state.axis = null
    state.totalDelta = 0

    // Inform adapter of press/target resolution
    engineAdapter.onPress(x, y)
}

function onMove(x, y) {
    if (state.phase === 'IDLE') return
    drawDots(x, y, 'yellow')
    const deltaX = x - state.startX
    const deltaY = y - state.startY
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    
    // Detect swipe axis
    if (state.phase === 'PENDING') {
        const axis = absX > absY ? 'horizontal' : 'vertical'

        // Escalate purely on movement; adapter decides ownership
        const accepted = engineAdapter.onSwipeStart(x, y, axis)
        if (!accepted) {
            log('input', 'Swipe start rejected by adapter')
            engineAdapter.onPressRelease({
                type: 'pressRelease',
                x: state.startX,
                y: state.startY
            })
            state.phase = 'IDLE'
            return
        }
        // intentEngine only detects gesture intent.
        // It must not check swipe capability or target policy.
        state.phase = 'SWIPING'
        state.axis = axis
        state.lastAxisPos = axis === 'horizontal' ? state.startX : state.startY
        log('swipe', 'Swiping started, axis:', state.axis)
    }

    // Track swipe delta on locked axis
    if (state.phase === 'SWIPING') {
        const currentAxisPos = state.axis === 'horizontal' ? x : y
        const delta = currentAxisPos - state.lastAxisPos
        state.lastAxisPos = currentAxisPos
        state.totalDelta += delta
        engineAdapter.onSwipe({
            type: 'swipe',
            axis: state.axis,
            x,
            y,
            delta: state.totalDelta, // keep numeric total for 1D swipes
            rawDelta: {
                x: deltaX,
                y: deltaY
            }
        })
    }
}

function onUp() {
    if (state.phase === 'SWIPING') {
        if (!state.axis) {
            engineAdapter.onSwipeRevert()
            state.phase = 'IDLE'
            return
        }

        if (engineAdapter.shouldCommitSwipe(state.totalDelta, state.axis)) {
            const direction = getSwipeDirection(state.axis, state.totalDelta)
            log('swipe', '[', direction, ']', 'delta:', state.totalDelta)

            engineAdapter.onSwipeCommit({
                type: 'swipe-commit',
                axis: state.axis,
                direction,
                delta: state.totalDelta
            })
        } else {
            log('swipe', 'rejected', 'delta:', state.totalDelta)
            if (engineAdapter.shouldRevertSwipe()) {
                engineAdapter.onSwipeRevert()
            } else {
                const direction = getSwipeDirection(state.axis, state.totalDelta)
                engineAdapter.onSwipeCommit({
                    type: 'swipe-commit',
                    axis: state.axis,
                    direction,
                    delta: state.totalDelta
                })
            }
        }
    } else if (state.phase === 'PENDING') {
        // Pointer up without swipe → release
        engineAdapter.onPressRelease({
            type: 'pressRelease',
            x: state.startX,
            y: state.startY
        })
    }

    state.phase = 'IDLE'
    state.axis = null
}

function getSwipeDirection(axis, delta) {
    if (axis === 'horizontal') {
        return delta > 0 ? 'right' : 'left'
    }
    return delta > 0 ? 'down' : 'up'
}
