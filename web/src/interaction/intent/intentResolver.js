//resolver.js

import { policy } from './gesturePolicy'

export const resolve = {
    press(intent) {
        const target = policy.resolveTarget(intent)
        if (!target) return null
        return {
            type: 'press',
            target: target,
            delta: intent.delta
        }
    },

    swipeStart(intent, facts) {
        const resolved = policy.resolveSwipeTarget(intent, facts)
        if (!resolved || !resolved.axis) return null
        return {
            type: 'swipeStart',
            target: resolved.target,
            delta: policy.resolveDelta(intent.delta, resolved.axis, resolved.swipeType),
            axis: resolved.axis,
            pressCancel: resolved.pressCancel
                ? facts.target
                : null
        }
    },

    swipe(intent, facts) {
        if (policy.resolveSupports(intent.type, facts.target)) {
            return {
                type: 'swipe',
                target: facts.target,
                delta: policy.resolveDelta(intent.delta, facts.axis, facts.swipeType),
            }
        }
        return null
    },

    swipeEnd(intent, facts) {
        if (policy.resolveSupports(intent.type, facts.target)) {
            //facts.target.type = 'swipeCommit'
            return {
                type: 'swipeCommit',
                target: facts.target,
                delta: policy.resolveDelta(intent.delta, facts.axis, facts.swipeType)
            }
        }
        return null
    },

    pressRelease(intent, facts) {
        if (policy.resolveSupports(intent.type, facts.target)) {
            return {
                type: 'pressRelease',
                target: facts.target,
                delta: policy.resolveDelta(intent.delta, facts.axis, facts.swipeType)
            }
        }
        return null
    }
}