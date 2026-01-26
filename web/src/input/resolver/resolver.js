//resolver.js

import { domRegistry } from "../dom/domRegistry"
import { descriptorBuilder } from "../render/descriptorBuild"
import { supports, resolveAxis, shouldLockAxis } from "../render/gesturePolicy"

export const resolve = {

    pressElement(intent) {
        const target = domRegistry.findElementAt(intent.delta.x, intent.delta.y)

        if (target && supports(intent.type, target)) {
            return descriptorBuilder.buildPress({ intent, target })

            // reaction: target.reaction || null 
        }
        return null
    },

    swipeElement(intent, facts) {
        const resolvedAxis = resolveAxis(intent.axis, facts.currentTarget)
        if (!resolvedAxis) { return null }

        const lockAxis = shouldLockAxis(facts.currentTarget)
        return descriptorBuilder.buildSwipeStart(intent, facts.currentTarget, resolvedAxis, lockAxis)
        // reaction: facts.currentTarget.reaction,
        // control: { accepted: true, lockAxis },
        // meta: {
        //     element: facts.currentTarget,
        //     phaseType: intent.type,
        //     axis: resolvedAxis
        // }
    },

    backupSwipeElement(intent, facts) {
        const newTarget = domRegistry.findLaneByAxis(intent.delta.x, intent.delta.y, intent.axis)
        if (!newTarget) { return null }

        const lockAxis = shouldLockAxis(newTarget)
        let old
        if (supports('pressCancel', facts.currentTarget)) {
            old = facts.currentTarget.reaction
        }
        return descriptorBuilder.buildSwipeStart(intent, facts.currentTarget, newTarget.axis, lockAxis, old)
        // reaction: [newTarget.reaction, old],
        // control: { accepted: true, lockAxis },
        // meta: {
        //     element: newTarget,
        //     phaseType: 'swipe-start'
        // }

    },

    swipe(intent, facts) {
        if (supports(intent.type, facts.currentTarget)) {
            return descriptorBuilder.buildSwipeType(intent, facts.currentTarget)

                // reaction: facts.currentTarget.reaction
            
        }
    },

    swipeEnd(intent, facts) {
        if (supports(intent.type, facts.currentTarget)) {
            return descriptorBuilder.buildSwipeType(intent, facts.currentTarget)
                // reaction: facts.currentTarget.reaction
            
        }
    },

    pressRelease(intent, facts) {
        if (supports(intent.type, facts.currentTarget)) {
            return descriptorBuilder.buildSwipeType(intent, facts.currentTarget)
                // reaction: facts.currentTarget.reaction
            
        }
    }
}