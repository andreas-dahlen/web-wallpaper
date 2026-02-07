//resolver.js

import { policy } from './intentHelpers'

export const resolve = {
    press(intent) {
        const target = policy.resolveTarget(intent)
        if (!target) return null
        return {
            type: intent.type,
            target: target,
            delta: intent.delta
        }
    },

    swipeStart(intent, facts) {
        const resolved = policy.resolveSwipeTarget(intent, facts)
        if (!resolved || !resolved.axis) return null
        return {
            type: intent.type,
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
                type: intent.type,
                target: facts.target,
                delta: policy.resolveDelta(intent.delta, facts.axis, facts.swipeType),
            }
        }
        return null
    },

    swipeCommit(intent, facts) {
        if (policy.resolveSupports(intent.type, facts.target)) {

            return {
                type: intent.type,
                target: facts.target,
                delta: policy.resolveDelta(intent.delta, facts.axis, facts.swipeType)
            }
        }
        return null
    },

    pressRelease(intent, facts) {
        if (policy.resolveSupports(intent.type, facts.target)) {
            return {
                type: intent.type,
                target: facts.target,
                delta: policy.resolveDelta(intent.delta, facts.axis, facts.swipeType)
            }
        }
        return null
    }
}