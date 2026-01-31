//resolver.js

import { policy } from '../render/gesturePolicy'

export const resolve = {
    pressElement(intent) {
        const target = policy.resolveTarget(intent)
        if (!target) return null
        return {
            target,
            delta: intent.delta
        }
    },

    swipeElement(intent, facts) {
        const resolved = policy.resolveSwipeTarget(intent, facts)
        if (!resolved || !resolved.axis) return null
        return {
            target: resolved.target,
            delta: policy.resolveDeltaLock(intent.delta, resolved.axis),
            axis: resolved.axis,
            pressCancel: resolved.pressCancel ?? false
        }
    },

    canSwipe(intent, facts) {
        if (policy.resolveSupports(intent.type, facts.currentTarget)) {
            return {
                delta: policy.resolveDeltaLock(intent.delta, facts.axis),
                pressCancel: false,
            }
        }
        return null
    },

    canSwipeEnd(intent, facts) {
        if (policy.resolveSupports(intent.type, facts.currentTarget)) {
            return {
                delta: policy.resolveDeltaLock(intent.delta, facts.axis)
            }
        }
        return null
    },

    canPressRelease(intent, facts) {
        if (policy.resolveSupports(intent.type, facts.currentTarget)) {
            return {
                delta: policy.resolveDeltaLock(intent.delta, facts.axis)
            }
        }
        return null
    }
}