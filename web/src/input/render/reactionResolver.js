/**
 * reactionResolver.js - Intent → reaction descriptors
 *
 * Responsibilities:
 * - Use domRegistry to resolve declared reactions at coordinates
 * - Enforce the reaction schema: press, pressRelease, pressCancel, swipeStart, swipe, swipeCommit, swipeRevert, select, deselect
 * - Return plain descriptors only (no DOM changes, no renderer calls)
 *
 * Constraints:
 * - No DOM mutation, timers, or platform branching
 * - Swipe math remains unchanged; raw {x, y} is threaded through for consumers
 * - Selection is visual-only and single-target; ownership never changes
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
    swipeType: null,
    reactions: {}
}

let pressActive = false
let swipeActive = false
let pressedTarget = null
let selectedElement = null

function isDragType(swipeType) {
    return swipeType === 'drag' || swipeType === 'drag-and-drop' || swipeType === 'dragAndDrop'
}

function isSliderType(swipeType) {
    return swipeType === 'slider'
}

function directionMatches(targetDirection, axis) {
    if (!targetDirection) return false
    if (targetDirection === 'both') return true
    return targetDirection === axis
}

function swipeAllowedForType(target, axis) {
    if (!target?.element) return false
    if (isDragType(target.swipeType)) return true
    return directionMatches(target.laneAxis, axis)
}

// Always return either a single descriptor or a flat array (never nested).
function mergeDescriptors(existing, extra) {
    if (!existing && !extra) return null
    const list = []
    const push = (value) => {
        if (!value) return
        if (Array.isArray(value)) {
            list.push(...value)
        } else {
            list.push(value)
        }
    }
    push(existing)
    push(extra)
    if (!list.length) return null
    return list.length === 1 ? list[0] : list
}

function emitSelect(target) {
    if (!target?.element || selectedElement === target.element) return null
    const deselect = emitDeselect()
    selectedElement = target.element
    return mergeDescriptors(deselect, { type: 'select', element: target.element })
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
            swipeType: null,
            reactions: {}
        }
    }
    const reactions = target.reactions || {}
    const canonicalReactions = {
        press: !!reactions.press,
        pressRelease: !!reactions.pressRelease,
        pressCancel: !!reactions.pressCancel,
        swipeStart: !!reactions.swipeStart,
        swipe: !!reactions.swipe,
        swipeCommit: !!reactions.swipeCommit,
        swipeRevert: !!reactions.swipeRevert,
        select: !!reactions.select,
        deselect: !!reactions.deselect
    }
    return {
        ...target,
        laneAxis: target.laneAxis ?? target.direction ?? null,
        swipeType: target.swipeType ?? null,
        reactions: canonicalReactions
    }
}

function withLaneReactions(target) {
    return {
        ...target,
        reactions: {
            ...target.reactions,
            swipeStart: true,
            swipe: true,
            swipeCommit: true,
            pressCancel: true
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

        const existingAllowed = swipeAllowedForType(currentTarget, axis) && supports('swipeStart')

        if (!existingAllowed) {
            const lane = domRegistry.findLaneByAxis(x, y, axis)
            if (!lane) {
                if (pressActive && pressedTarget?.element) {
                    reactions.push({
                        type: 'pressCancel',
                        laneId: pressedTarget.laneId,
                        element: pressedTarget.element
                    })
                }
                pressActive = false
                pressedTarget = null
                swipeActive = false
                return reactions.length ? (reactions.length === 1 ? reactions[0] : reactions) : null
            }

            setCurrent(withLaneReactions({
                element: lane.element,
                laneId: lane.laneId,
                laneAxis: lane.direction,
                swipeType: lane.swipeType,
                actionId: null
            }))
        }

        if (!supports('swipeStart')) return null

        if (pressActive && pressedTarget?.element) {
            reactions.push({
                type: 'pressCancel',
                laneId: pressedTarget.laneId,
                element: pressedTarget.element
            })
            pressActive = false
            pressedTarget = null
        }

        reactions.push({
            type: 'swipeStart',
            laneId: currentTarget.laneId,
            axis,
            element: currentTarget.element,
            swipeType: currentTarget.swipeType,
            direction: currentTarget.laneAxis,
            raw: { x, y }
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
            delta: isDragType(currentTarget.swipeType)
                ? (intent.rawDelta || intent.delta || { x: 0, y: 0 })
                : normalizeSwipeDelta(intent.delta),
            element: currentTarget.element,
            swipeType: currentTarget.swipeType,
            direction: currentTarget.laneAxis,
            raw: intent.raw || { x: intent.x, y: intent.y }
        }
        return mergeDescriptors(swipeDescriptor, deselect)
    },

    onSwipeCommit(intent) {
        if (!swipeActive || !currentTarget.laneId) return null
        if (!supports('swipeCommit')) return null
        const descriptor = {
            type: 'swipeCommit',
            laneId: currentTarget.laneId,
            direction: intent.direction,
            axis: intent.axis,
            delta: isDragType(currentTarget.swipeType)
                ? (intent.rawDelta || intent.delta || { x: 0, y: 0 })
                : normalizeSwipeDelta(intent.delta),
            element: currentTarget.element,
            swipeType: currentTarget.swipeType,
            laneDirection: currentTarget.laneAxis,
            commitStrategy: currentTarget.swipeType || 'default'
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
            element: currentTarget.element,
            swipeType: currentTarget.swipeType,
            laneDirection: currentTarget.laneAxis
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

        if (sameElement && target.reactions?.pressRelease) {
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
        if (isDragType(currentTarget.swipeType) || isSliderType(currentTarget.swipeType)) {
            return true
        }
        // 1. Lane-based sizing (preferred)
        if (currentTarget.laneId && shouldStartSwipeLane(currentTarget.laneId, delta)) {
            return true
        }


        // 2. Axis-based viewport fallback
        const size = getAxisSize(axis)

        return shouldStartSwipeBySize(size, delta)
    },

    shouldCommitSwipe(delta, axis) {
        if (isDragType(currentTarget.swipeType) || isSliderType(currentTarget.swipeType)) {
            return true
        }
        // 1. Lane-based sizing (preferred)
        if (currentTarget.laneId && shouldCommitSwipeLane(currentTarget.laneId, delta)) {
            return true
        }

        // 2. Axis-based viewport fallback
        const size = getAxisSize(axis)

        return shouldCommitSwipeBySize(size, delta)
    }
}