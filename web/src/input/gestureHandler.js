/**
 * Unified Gesture Handler
 * 
 * Handles both JS DOM events and Android bridge events with a single,
 * simplified state machine. Eliminates the need for separate engines,
 * event buses, and complex routing.
 * 
 * States: IDLE → PENDING → SWIPING → IDLE
 * 
 * Performance optimizations:
 * - Single DOM query on pointer down (cached for entire gesture)
 * - Only tracks the locked axis after threshold detection
 * - Direct callbacks instead of event bus
 * - No momentum handling (page-based carousels use CSS transitions)
 */

import { ensureLane, applyLaneOffset, commitLaneSwipe } from '../state/swipeState'
import { APP_SETTINGS } from '../config/appSettings'

// ============================================================================
// Configuration
// ============================================================================

const SWIPE_THRESHOLD = APP_SETTINGS.input.swipeThreshold || 8
const COMMIT_THRESHOLD = APP_SETTINGS.input.swipeViewChangeThreshold || 40

// Debug logging (respects DEBUG settings)
const DEBUG_ENABLED = false // Set to true for development

function log(...args) {
    if (DEBUG_ENABLED) {
        console.log('[GestureHandler]', ...args)
    }
}

// ============================================================================
// State
// ============================================================================

const state = {
    // Current gesture phase
    phase: 'IDLE', // 'IDLE' | 'PENDING' | 'SWIPING'

    // Starting position (for threshold detection)
    startX: 0,
    startY: 0,

    // Last position in locked axis (for delta calculation)
    lastAxisPos: 0,

    // Locked axis after threshold
    axis: null, // 'horizontal' | 'vertical' | null

    // Accumulated delta in swipe direction
    totalDelta: 0,

    elId: null,
    elAxis: null,
    // Platform mode
    isAndroid: false
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the gesture handler.
 * Auto-detects platform and sets up appropriate event listeners.
 */
export function initGestureHandler() {
    state.isAndroid = typeof Android !== 'undefined'

    if (state.isAndroid) {
        // Android mode: expose global handler for Kotlin bridge
        window.handleTouch = handleAndroidTouch
        log('Initialized in Android mode')
    } else {
        // Browser mode: attach DOM event listeners
        window.addEventListener('pointerdown', onPointerDown)
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)
        window.addEventListener('pointercancel', onPointerUp) //SHOULD BE CANCEL... ONPOINTERCANCEL AND HAPPENS TO A BUTTON WHEN SWIPE IS INITIALIZED
        log('Initialized in Browser mode')
    }
}

/**
 * Called by Kotlin to confirm Android engine is ready.
 * This replaces the complex initAndroidEngine retry logic.
 */
window.initAndroidEngine = () => {
    state.isAndroid = true
    log('Android engine confirmed')
    return 'success'
}

// ============================================================================
// Android Bridge Handler
// ============================================================================

let currentSeqId = 0

/**
 * Global handler called by Kotlin: handleTouch('down', x, y, seqId)
 * Coordinates are already normalized to BASE_WIDTH/BASE_HEIGHT (364x800)
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

// ============================================================================
// Browser DOM Event Handlers
// ============================================================================

function onPointerDown(e) {
    handleDown(e.clientX, e.clientY)
}

function onPointerMove(e) {
    handleMove(e.clientX, e.clientY)
}

function onPointerUp() {
    handleUp()
}

// ============================================================================
// Core Gesture Logic
// ============================================================================

/**
 * Handle pointer/touch down.
 * Finds the target lane and prepares for potential swipe.
 */
function handleDown(x, y) {
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
        log('Down on:', state.elId)
    } else {
        log('Down - no element found')
    }
}

/**
 * Handle pointer/touch move.
 * Detects axis lock, then tracks only the locked axis.
 */
function handleMove(x, y) {
    if (state.phase === 'IDLE') return

    // Phase 1: Detect axis (PENDING → SWIPING)
    if (state.phase === 'PENDING') {
        const dx = x - state.startX
        const dy = y - state.startY
        const absX = Math.abs(dx)
        const absY = Math.abs(dy)

        // Not enough movement yet
        if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) {
            return
        }

        // Lock axis based on dominant direction
        state.axis = absX > absY ? 'horizontal' : 'vertical'

        // Check if the current element supports this axis; if not, walk up to find one that does
        const resolved = axisProcessing(x, y, state.axis)
        if (!resolved) {
            console.log('axis error')
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

        log('Swiping started, axis:', state.axis)
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
            log('Swipe committed:', dir, 'delta:', state.totalDelta)
            commitLaneSwipe(state.elId, dir)
        } else {
            // Reject - snap back
            log('Swipe rejected, delta:', state.totalDelta)
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

// ============================================================================
// Helpers
// ============================================================================

/**
 * Find the lane element at the given coordinates.
 * Uses data-lane attribute for identification.
 */
function findLaneElement(x, y) {
    const elements = document.elementsFromPoint(x, y)
    return elements.find(el => el.dataset && el.dataset.lane) || null
}

function axisProcessing(x, y, axis) {
    if (state.elAxis === axis) return true
    const elements = document.elementsFromPoint(x, y);
    const el = elements.find(el => el.dataset?.direction === axis);
    if (!el) return false;
    state.elId = el.dataset.lane;
    log('element changed: ', state.elId)
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

// ============================================================================
// Debug Helpers
// ============================================================================

export function getGestureState() {
    return { ...state }
}
