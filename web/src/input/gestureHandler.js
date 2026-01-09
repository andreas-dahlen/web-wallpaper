
import { ensureLane, applyLaneOffset, commitLaneSwipe } from '../state/swipeState'
import { APP_SETTINGS } from '../config/appSettings'
import { log, drawDots } from '../debug/functions'

// =====================================================
// Configuration
// =====================================================

const SWIPE_THRESHOLD = APP_SETTINGS.swipeThreshold
const COMMIT_THRESHOLD = APP_SETTINGS.swipeViewChangeThreshold

// =====================================================
// State
// =====================================================

const state = {
    // Current gesture phase
    phase: 'IDLE', // 'IDLE' | 'PENDING' | 'SWIPING'

    // Starting position (for threshold detection) in design px
    startX: 0,
    startY: 0,

    // Last position in locked axis (for delta calculation) in design px
    lastAxisPos: 0,

    // Locked axis after threshold
    axis: null, // 'horizontal' | 'vertical' | null

    // Accumulated delta in swipe direction (design px)
    totalDelta: 0,

    elId: null,
    elAxis: null,
}

// =====================================================
// Initialization
// =====================================================

/**
 * Initialize the gesture handler.
 * Auto-detects platform and sets up appropriate event listeners.
 */
export function initGestureHandler() {

    if (APP_SETTINGS.platform === 'android') {
        // Android mode: expose global handler for Kotlin bridge
        window.handleTouch = handleAndroidTouch
        log('init', 'Initialized in Android mode')
    } else {
        // Browser mode: attach DOM event listeners
        window.addEventListener('pointerdown', onPointerDown)
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)
        window.addEventListener('pointercancel', onPointerUp)
        log('init', 'Initialized in Browser mode')
    }
}

/**
 * Called by Kotlin to confirm Android engine is ready.
 * This replaces the complex initAndroidEngine retry logic.
 */
window.initAndroidEngine = () => {
    log('init', 'Android engine confirmed')
    return 'success'
}

// =====================================================
// Android Bridge Handler
// =====================================================

let currentSeqId = 0

/**
 * Global handler called by Kotlin: handleTouch('down', x, y, seqId)
 * Coordinates are already normalized to the current device dimensions
 */
function handleAndroidTouch(type, x, y, seqId) {
    // Reject stale events from previous gesture
    if (type === 'down') {
        currentSeqId = seqId
    } else if (seqId !== currentSeqId) {
        return // Stale event, ignore
    }

    switch (type) {
        case 'down':
            handleDown(x, y)
            break
        case 'move':
            handleMove(x, y)
            break
        case 'up':
            handleUp()
            break
        // 'momentum' events are intentionally ignored
        // Page-based carousels use CSS transitions, not physics
    }
}

// =====================================================
// Browser DOM Event Handlers
// =====================================================

function onPointerDown(e) {
    handleDown(e.clientX, e.clientY)
}

function onPointerMove(e) {
    handleMove(e.clientX, e.clientY)
}

function onPointerUp() {
    handleUp()
}

// =====================================================
// Core Gesture Logic
// =====================================================

/**
 * Handle pointer/touch down.
 * Finds the target lane and prepares for potential swipe.
 */
function handleDown(x, y) {
    drawDots(x, y, 'green')
    log('input', `[@DOWN] X = ${x} Y = ${y}`)
    // Reset state for new gesture
    state.phase = 'PENDING'
    state.startX = x
    state.startY = y
    state.lastAxisPos = 0
    state.axis = null
    state.totalDelta = 0
    state.elId = null
    state.targetEl = null
    state.elAxis = null

    // Find lane at touch point (single DOM query, cached for gesture)
    const el = findLaneElement(x, y)
    if (el) {
        state.elId = el.dataset.lane
        state.elAxis = el.dataset.direction
        log('dom', `[@DOWN] ${state.elId}`)
    } else {
        log('dom', '[@DOWN] no element found')
    }
}

/**
 * Handle pointer/touch move.
 * Detects axis lock, then tracks only the locked axis.
 */
function handleMove(x, y) {
    if (state.phase === 'IDLE') return
    drawDots(x, y, 'yellow')
    // Phase 1: Detect axis (PENDING → SWIPING)
    if (state.phase === 'PENDING') {
        const deltaX = x - state.startX
        const deltaY = y - state.startY
        const absX = Math.abs(deltaX)
        const absY = Math.abs(deltaY)

        // Not enough movement yet
        if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) {
            return
        }

        // Lock axis based on dominant direction
        state.axis = absX > absY ? 'horizontal' : 'vertical'

        // Check if the current element supports this axis; if not, walk up to find one that does
        const resolved = axisProcessing(x, y, state.axis)
        if (!resolved) {
            log('dom', 'dom-axis not found')
            state.phase = 'IDLE'
            return
        }

        // Initialize for swiping
        state.lastAxisPos = state.axis === 'horizontal' ? state.startX : state.startY
        state.phase = 'SWIPING'

        // Mark lane as dragging (disables CSS transition)
        const lane = ensureLane(state.elId)
        lane.dragging = true
        lane.pendingDir = null

        log('swipe', 'Swiping started, axis:', state.axis)
    }

    // Phase 2: Track delta in locked axis only
    if (state.phase === 'SWIPING') {
        const currentAxisPos = state.axis === 'horizontal' ? x : y
        const delta = currentAxisPos - state.lastAxisPos
        state.lastAxisPos = currentAxisPos
        state.totalDelta += delta

        // Apply offset to carousel (instant, no transition)
        applyLaneOffset(state.elId, state.totalDelta)
    }
}

/**
 * Handle pointer/touch up.
 * Commits or rejects the swipe, then resets.
 */
function handleUp() {
    if (state.phase === 'SWIPING' && state.elId) {
        const lane = ensureLane(state.elId)

        if (Math.abs(state.totalDelta) > COMMIT_THRESHOLD) {
            // Commit swipe - determine direction
            const dir = getSwipeDirection(state.axis, state.totalDelta)
            log('Swipe', '[', dir, ']', 'delta:', state.totalDelta)
            commitLaneSwipe(state.elId, dir)
        } else {
            // Reject - snap back
            log('Swipe', 'rejected', 'delta:', state.totalDelta)
            lane.offset = 0
            lane.pendingDir = null
            lane.dragging = false
        }
    }

    // Reset to idle
    state.phase = 'IDLE'
    state.axis = null
    state.elId = null
    state.targetEl = null
    state.elAxis = null
}

// =====================================================
// Helpers
// =====================================================

/**
 * Find the lane element at the given coordinates.
 * Uses data-lane attribute for identification.
 */
function findLaneElement(x, y) {
    const elements = document.elementsFromPoint(x, y)
    return elements.find(el => el.dataset && el.dataset.lane) || null
}

function axisProcessing(x, y) {
    if (state.elAxis === state.axis) return true
    const elements = document.elementsFromPoint(x, y);
    const el = elements.find(el => el.dataset?.direction === state.axis);
    if (!el) return false;
    state.elId = el.dataset.lane;
    log('dom', 'element changed: ', state.elId)
    return true;
}


/**
 * Convert axis + delta to direction string.
 */
function getSwipeDirection(axis, delta) {
    if (axis === 'horizontal') {
        return delta > 0 ? 'right' : 'left'
    }
    return delta > 0 ? 'down' : 'up'
}


// =====================================================
// Debug Helpers
// =====================================================

export function getGestureState() {
    return { ...state }
}
