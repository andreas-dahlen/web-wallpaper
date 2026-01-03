import { log } from '../debug/gestureDebug'

// central registry of touch/mouse targets
class InputRegistry {
    constructor() {
        this.targets = new Map() // el => { onPress, onRelease, onSwipe, etc }
    }

    registerTarget(el, handlers) {
        if (!el) return
        this.targets.set(el, handlers)
        log('targetRegistry', 'Registered target:', el.id || el.className || el.tagName)
    }

    unregisterTarget(el) {
        if (!el) return
        this.targets.delete(el)
        log('targetRegistry', 'Unregistered target:', el.id || el.className || el.tagName)
    }

    getTarget(el) {
        return this.targets.get(el)
    }

    getAllTargets() {
        return Array.from(this.targets.values())
    }
    // --- JS driver API ----
    hasTarget(el) {
        return this.targets.has(el)
    }

    triggerPress(el, event) {
        const t = this.getTarget(el)
        t?.onPress?.(event)
    }

    triggerRelease(el, event) {
        const t = this.getTarget(el)
        t?.onRelease?.(event)
    }

    triggerCancel(el) {
        const t = this.getTarget(el)
        t?.onPressCancel?.()
    }

    hasSwipe(el, axis) {
        const t = this.getTarget(el)
        if (!t || !t.onSwipe) return false
        if (axis === 'horizontal') return t.onSwipe.left || t.onSwipe.right
        if (axis === 'vertical') return t.onSwipe.up || t.onSwipe.down
        return false
    }

    getSwipeConfig(el) {
        const t = this.getTarget(el)
        if (!t) return null
        return { handlers: t.onSwipe }
    }
}

export const gestureTargetRegistry = new InputRegistry()
