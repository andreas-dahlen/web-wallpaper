//resolver.js

import { domRegistry } from "../dom/domRegistry"
import { supports, resolveAxis, shouldLockAxis } from "../render/gesturePolicy"

export const resolve = {

    pressElement(intent) {
        const target = domRegistry.findElementAt(intent.delta.x, intent.delta.y)
        if (target && supports(intent.type, target)) {
            return {
                type: intent.type,
                target: target }
        }
        return null
    },

    swipeElement(intent, facts) {
        const resolvedAxis = resolveAxis(intent.axis, facts.currentTarget)
        if (!resolvedAxis) return null
        const lockAxis = shouldLockAxis(facts.currentTarget)
        return {
            type: intent.type,
            axis: resolvedAxis,
            lockAxis: lockAxis
        }
    },

    backupSwipeElement(intent, facts) {
        const newTarget = domRegistry.findLaneByAxis(intent.delta.x, intent.delta.y, intent.axis)
        if (!newTarget) return null
        const lockAxis = shouldLockAxis(newTarget)
        const pressCancel = supports('pressCancel', facts.currentTarget)
        return {
            type: intent.type,
            target: newTarget.element,
            axis: newTarget.axis,
            lockAxis: lockAxis,
            pressCancel: pressCancel
        }
    },

    canSwipe(intent, facts) {
        if (supports(intent.type, facts.currentTarget)) {
            return { 
                type: intent.type,
                yes: true,
                pressCancel: false
            }
        }
        return null
    },

    canSwipeEnd(intent, facts) {
        if (supports(intent.type, facts.currentTarget)) {
            return { 
                type: intent.type,
                yes: true 
            }
        }
        return null
    },

    canPressRelease(intent, facts) {
        if (supports(intent.type, facts.currentTarget)) {
            return { 
                type: intent.type,
                yes: true 
            }
        }
        return null
    }
}