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
    engineAdapter.onGestureStart(x, y)
}

function onMove(x, y) {
    if (state.phase === 'IDLE') return
    drawDots(x, y, 'yellow')

    // Detect swipe axis
    if (state.phase === 'PENDING') {
        const deltaX = x - state.startX
        const deltaY = y - state.startY
        const absX = Math.abs(deltaX)
        const absY = Math.abs(deltaY)
        const axis = absX > absY ? 'horizontal' : 'vertical'
        const delta = axis === 'horizontal' ? deltaX : deltaY
        if (!engineAdapter.shouldStartSwipe(delta)) return
        const accepted = engineAdapter.onSwipeStart(x, y, axis)
        if (!accepted) {
            log('input', 'Swipe start rejected by adapter')
            state.phase = 'IDLE'
            return
        }

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

        engineAdapter.onDrag({
            type: 'swipe',
            axis: state.axis,
            x,
            y,
            delta: state.totalDelta
        })
    }
}

function onUp() {
    if (state.phase === 'SWIPING') {
        if (!state.axis) {
            engineAdapter.onSwipeCancel()
            state.phase = 'IDLE'
            return
        }

        if (engineAdapter.shouldCommitSwipe(state.totalDelta)) {
            const direction = getSwipeDirection(state.axis, state.totalDelta)
            log('swipe', '[', direction, ']', 'delta:', state.totalDelta)

            engineAdapter.onSwipeEnd({
                type: 'swipe-end',
                axis: state.axis,
                direction,
                delta: state.totalDelta
            })
        } else {
            log('swipe', 'rejected', 'delta:', state.totalDelta)
            engineAdapter.onSwipeCancel()
        }
    } else if (state.phase === 'PENDING') {
        // Pointer up without swipe → release
        engineAdapter.onRelease({
            type: 'release',
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