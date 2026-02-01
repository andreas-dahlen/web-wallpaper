//resolver.js

import { policy } from './gesturePolicy'

export const resolve = {
    press(intent) {
        const target = policy.resolveTarget(intent)
        if (!target) return null
        return {
            target,
            delta: intent.delta
        }
    },

    swipeStart(intent, facts) {
        const resolved = policy.resolveSwipeTarget(intent, facts)
        if (!resolved || !resolved.axis) return null
        return {
            target: resolved.target,
            delta: policy.resolveDeltaLock(intent.delta, resolved.axis),
            axis: resolved.axis,
            pressCancel: resolved.pressCancel
                ? facts.target
                : null
        }
    },

    swipe(intent, facts) {
        if (policy.resolveSupports(intent.type, facts.target)) {
            return {
                target: facts.target,
                delta: policy.resolveDeltaLock(intent.delta, facts.axis),
            }
        }
        return null
    },

    swipeEnd(intent, facts) {
        if (policy.resolveSupports(intent.type, facts.target)) {
            return {
                target: facts.target,
                delta: policy.resolveDeltaLock(intent.delta, facts.axis)
            }
        }
        return null
    },

    pressRelease(intent, facts) {
        if (policy.resolveSupports(intent.type, facts.target)) {
            return {
                target: facts.target,
                delta: policy.resolveDeltaLock(intent.delta, facts.axis)
            }
        }
        return null
    }
}