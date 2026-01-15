/**
 * reactionResolver.js - Intent → reaction descriptors
 *
 * Responsibilities:
 * - Use domRegistry to resolve declared reactions at coordinates
 * - Enforce the reaction schema: press, pressRelease, pressCancel, swipeStart, swipe, swipeCommit, swipeRevert
 * - Return plain descriptors only (no DOM changes, no renderer calls)
 */
import { getAxisSize, normalizeSwipeDelta } from '../../state/domState'
import { domRegistry } from '../dom/domRegistry'
import { log } from '../../debug/functions'
import {
    shouldStartSwipeLane,
    shouldStartSwipeBySize,
    shouldCommitSwipeLane,
    shouldCommitSwipeBySize
} from '../../state/swipeState'

let currentTarget = {
    element: null,
    laneId: null,
    laneAxis: null,
    actionId: null,
    reactions: {}
}

let pressActive = false
let swipeActive = false
let pressedTarget = null
let selectedElement = null

function mergeDescriptors(existing, extra) {
    if (!existing && !extra) return null
    if (!existing) return extra
    if (!extra) return existing
    if (Array.isArray(existing)) {
        return Array.isArray(extra) ? [...existing, ...extra] : [...existing, extra]
    }
    if (Array.isArray(extra)) {
        return [existing, ...extra]
    }
    return [existing, extra]
}

function emitSelect(target) {
    if (!target?.element || selectedElement === target.element) return null
    selectedElement = target.element
    return { type: 'select', element: target.element }
}

function emitDeselect() {
    if (!selectedElement) return null
    const descriptor = { type: 'deselect', element: selectedElement }
    selectedElement = null
    return descriptor
}

function normalize(target) {
    if (!target) {
        return {
            element: null,
            laneId: null,
            laneAxis: null,
            actionId: null,
            reactions: {}
        }
    }
    return {
        ...target,
        laneAxis: target.laneAxis ?? target.direction ?? null,
        reactions: target.reactions || {}
    }
}

function withLaneReactions(target) {
    return {
        ...target,
        reactions: {
            ...target.reactions,
            swipeStart: true,
            swipe: true,
            swipeEnd: true,
            cancel: true
        }
    }
}

function setCurrent(target) {
    currentTarget = normalize(target)
}

function supports(type) {
    return !!currentTarget.reactions?.[type]
}

export const reactionResolver = {
    onPress(x, y) {
        const intent = domRegistry.findIntentAt(x, y)
        if (!intent) { setCurrent(null); pressedTarget = null; pressActive = false; swipeActive = false; return emitDeselect() }
        setCurrent(intent)
        pressActive = supports('press')
        swipeActive = false
        pressedTarget = pressActive ? currentTarget : null

        if (supports('press')) {
            const pressDescriptor = {
                type: 'press',
                actionId: intent.actionId || null,
                laneId: intent.laneId || null,
                element: intent.element,
            }
            const selectDescriptor = emitSelect(intent)
            return mergeDescriptors(pressDescriptor, selectDescriptor)
        }
        log('dom', intent)
        return emitDeselect()
    },

    onSwipeStart(x, y, axis) {
        const hit = domRegistry.findIntentAt(x, y)
        const deselect = hit?.element === selectedElement ? null : emitDeselect()
        const reactions = []

        // Resolve correct owner (existing logic)
        if (!currentTarget.element || currentTarget.laneAxis !== axis) {
            const prevTarget = currentTarget
            const lane = domRegistry.findLaneByAxis(x, y, axis)
            if (!lane) return null

            setCurrent(withLaneReactions({
                element: lane.element,
                laneId: lane.laneId,
                laneAxis: lane.direction,
                actionId: null
            }))

            if (pressActive) {
                reactions.push({
                    type: 'pressCancel',
                    laneId: prevTarget.laneId,
                    element: prevTarget.element
                })
                pressActive = false
                pressedTarget = null
            }

            reactions.push({
                type: 'swipeStart',
                laneId: currentTarget.laneId,
                axis,
                element: currentTarget.element
            })

            swipeActive = true
            return mergeDescriptors(reactions.length === 1 ? reactions[0] : reactions, deselect)
        }

        if (!supports('swipeStart')) return null

        if (pressActive) {
            reactions.push({
                type: 'pressCancel',
                laneId: currentTarget.laneId,
                element: currentTarget.element
            })
            pressActive = false
            pressedTarget = null
        }

        reactions.push({
            type: 'swipeStart',
            laneId: currentTarget.laneId,
            axis,
            element: currentTarget.element
        })

        swipeActive = true
        return mergeDescriptors(reactions.length === 1 ? reactions[0] : reactions, deselect)
    },

    onSwipe(intent) {
        const hit = domRegistry.findIntentAt(intent.x, intent.y)
        const deselect = hit?.element === selectedElement ? null : emitDeselect()

        if (!swipeActive || !currentTarget.laneId) return deselect
        if (!supports('swipe')) return deselect

        const swipeDescriptor = {
            type: 'swipe',
            laneId: currentTarget.laneId,
            axis: intent.axis,
            delta: normalizeSwipeDelta(intent.delta),
            element: currentTarget.element
        }
        return mergeDescriptors(swipeDescriptor, deselect)
    },

    onSwipeCommit(intent) {
        if (!swipeActive || !currentTarget.laneId) return null
        if (!supports('swipeEnd')) return null
        const descriptor = {
            type: 'swipeCommit',
            laneId: currentTarget.laneId,
            direction: intent.direction,
            axis: intent.axis,
            delta: intent.delta,
            element: currentTarget.element
        }
        pressActive = false
        swipeActive = false
        pressedTarget = null
        setCurrent(null)
        return mergeDescriptors(descriptor, emitDeselect())
    },

    onSwipeRevert() {
        if (!swipeActive || !currentTarget.element) {
            pressActive = false
            swipeActive = false
            setCurrent(null)
            return emitDeselect()
        }
        const descriptor = {
            type: 'swipeRevert',
            laneId: currentTarget.laneId,
            element: currentTarget.element
        }
        pressActive = false
        swipeActive = false
        pressedTarget = null
        setCurrent(null)
        return mergeDescriptors(descriptor, emitDeselect())
    },

    onPressRelease(intent) {
        const target = pressedTarget
        const hit = domRegistry.findIntentAt(intent.x, intent.y)
        const sameElement = target && hit?.element === target.element

        let descriptor = null

        if (sameElement && target.reactions?.release) {
            descriptor = {
                type: 'pressRelease',
                actionId: target.actionId || null,
                laneId: target.laneId || null,
                element: target.element,
            }
        } else if (target) {
            descriptor = {
                type: 'pressCancel',
                laneId: target.laneId,
                element: target.element
            }
        }

        pressActive = false
        swipeActive = false
        pressedTarget = null
        setCurrent(null)
        return mergeDescriptors(descriptor, emitDeselect())
    },

    shouldStartSwipe(delta, axis) {
        // 1. Lane-based sizing (preferred)
        if (currentTarget.laneId && shouldStartSwipeLane(currentTarget.laneId, delta)) {
            return true
        }


        // 2. Axis-based viewport fallback
        const size = getAxisSize(axis)

        return shouldStartSwipeBySize(size, delta)
    },

    shouldCommitSwipe(delta, axis) {
        // 1. Lane-based sizing (preferred)
        if (currentTarget.laneId && shouldCommitSwipeLane(currentTarget.laneId, delta)) {
            return true
        }

        // 2. Axis-based viewport fallback
        const size = getAxisSize(axis)

        return shouldCommitSwipeBySize(size, delta)
    }
}