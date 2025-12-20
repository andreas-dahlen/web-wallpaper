import { onMounted } from 'vue'
import { inputEngine } from './inputEngine'

/**
 * Vanilla-style registration for press/release/swipe on any element(s)
 * @param {string|HTMLElement} selector - CSS selector string or DOM element / ref.value
 * @param {object} handlers - { onPress?, onRelease?, onSwipe? }
 */
export function registerTouch(selector, handlers = {}) {
  onMounted(() => {
    let elements = []

    // Determine if selector is string or actual DOM element
    if (typeof selector === 'string') {
      elements = Array.from(document.querySelectorAll(selector))
    } else if (selector instanceof HTMLElement) {
      elements = [selector]
    }

    if (!elements.length) return

    const { onPress, onRelease, onSwipe } = handlers

    elements.forEach(el => {
      inputEngine.registerPressTarget(el, { onPress, onRelease, onSwipe })
    })
  })
}