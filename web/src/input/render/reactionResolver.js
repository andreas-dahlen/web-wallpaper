/**
 * reactionResolver.js - Intent → reaction descriptors
 *
 * Responsibilities:
 * - Use domRegistry to resolve declared reactions at coordinates
 * - Enforce the reaction schema: press, release, swipe-start, swipe, swipe-end, cancel
 * - Return plain descriptors only (no DOM changes, no renderer calls)
 */
import { scaledWidth, scaledHeight } from '../../state/domState'
import { domRegistry } from '../dom/domRegistry'
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

    function axisSize(axis) {
        if (axis === 'horizontal' || axis === 'x') return scaledWidth.value
        if (axis === 'vertical' || axis === 'y') return scaledHeight.value
        return 0
    }

function setCurrent(target) {
    currentTarget = normalize(target)
}

function supports(type) {
    return !!currentTarget.reactions?.[type]
}

export const reactionResolver = {
    onStart(x, y) {
        const intent = domRegistry.findIntentAt(x, y)
        if (!intent) {
            setCurrent(null)
            return null
        }

        setCurrent(intent)

        if (supports('press')) {
            return {
                type: 'press',
                actionId: intent.actionId || null,
                laneId: intent.laneId || null,
                element: intent.element
            }
        }

        return null
    },

    onSwipeStart(x, y, axis) {
        if (!currentTarget.element || currentTarget.laneAxis !== axis) {
            const lane = domRegistry.findLaneByAxis(x, y, axis)
            if (!lane) return null
            setCurrent(withLaneReactions({
                ...currentTarget,
                laneId: lane.laneId,
                laneAxis: lane.direction,
            }))
        }

        if (!currentTarget.laneId || currentTarget.laneAxis !== axis) return null
        if (!supports('swipeStart')) return null

        return {
            type: 'swipe-start',
            laneId: currentTarget.laneId,
            axis,
            element: currentTarget.element
        }
    },

    onDrag(intent) {
        if (!currentTarget.laneId) return null
        if (!supports('swipe')) return null
        return {
            type: 'swipe',
            laneId: currentTarget.laneId,
            axis: intent.axis,
            delta: intent.delta,
            element: currentTarget.element
        }
    },

    onSwipeEnd(intent) {
        if (!currentTarget.laneId) return null
        if (!supports('swipeEnd')) return null
        const descriptor = {
            type: 'swipe-end',
            laneId: currentTarget.laneId,
            direction: intent.direction,
            axis: intent.axis,
            delta: intent.delta,
            element: currentTarget.element
        }
        setCurrent(null)
        return descriptor
    },

    onSwipeCancel() {
        if (!currentTarget.element) return null
        if (!supports('cancel')) {
            setCurrent(null)
            return null
        }
        const descriptor = {
            type: 'cancel',
            laneId: currentTarget.laneId,
            element: currentTarget.element
        }
        setCurrent(null)
        return descriptor
    },

    onRelease(intent) {
        const target = currentTarget.element ? currentTarget : domRegistry.findIntentAt(intent.x, intent.y)
        if (!target) return null

        if (!target.reactions?.release) {
            setCurrent(null)
            return null
        }

        const descriptor = {
            type: 'release',
            actionId: target.actionId || null,
            laneId: target.laneId || null,
            element: target.element,
        }
        setCurrent(null)
        return descriptor
    },

    shouldStartSwipe(delta, axis) {
        // 1. Lane-based sizing (preferred)
        if (currentTarget.laneId && shouldStartSwipeLane(currentTarget.laneId, delta)) {
            return true
        }


        // 2. Axis-based viewport fallback
        const size = axisSize(axis)

        return shouldStartSwipeBySize(size, delta)
    },

    shouldCommitSwipe(delta, axis) {
        // 1. Lane-based sizing (preferred)
        if (currentTarget.laneId && shouldCommitSwipeLane(currentTarget.laneId, delta)) {
            return true
        }

        // 2. Axis-based viewport fallback
        const size = axisSize(axis)

        return shouldCommitSwipeBySize(size, delta)
    }
}