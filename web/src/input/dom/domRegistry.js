/**
 * domRegistry.js - Single DOM authority
 *
 * Responsibilities:
 * - Read data-* attributes
 * - Resolve elements and declared reactions
 * - Never mutates DOM, never triggers callbacks
 */

export const domRegistry = {
  findLaneAt(x, y) {
    const elements = document.elementsFromPoint(x, y)
    const el = elements.find(el => el.dataset && el.dataset.lane)
    if (!el) return null
    return {
      laneId: el.dataset.lane,
      direction: el.dataset.direction || null,
      element: el
    }
  },

  findLaneByAxis(x, y, axis) {
    const elements = document.elementsFromPoint(x, y)
    const el = elements.find(el => el.dataset?.direction === axis)
    if (!el) return null
    return {
      laneId: el.dataset.lane,
      direction: el.dataset.direction,
      element: el
    }
  },

  findActionAt(x, y) {
    const elements = document.elementsFromPoint(x, y)
    const el = elements.find(el => el.dataset && el.dataset.action)
    if (!el) return null
    return {
      actionId: el.dataset.action,
      element: el
    }
  },

  /**
   * Resolve the top-most element that declares intent.
   * Returns { element, laneId?, direction?, actionId?, pressable?, swipeable?, reactions }
   */
  findIntentAt(x, y) {
    const elements = document.elementsFromPoint(x, y)
    const el = elements.find(el => {
      const ds = el.dataset || {}
      return (
        ds.lane ||
        ds.action ||
        ds.press !== undefined ||
        ds.swipe !== undefined ||
        ds.reactPress !== undefined ||
        ds.reactRelease !== undefined ||
        ds.reactSwipe !== undefined ||
        ds.reactSwipeStart !== undefined ||
        ds.reactSwipeEnd !== undefined ||
        ds.reactCancel !== undefined
      )
    })

    if (!el) return null

    const ds = el.dataset || {}

    const pressDeclared = ds.press !== undefined || ds.reactPress !== undefined || ds.reactRelease !== undefined || ds.action !== undefined
    const swipeDeclared = ds.swipe !== undefined || ds.reactSwipe !== undefined || ds.reactSwipeStart !== undefined || ds.reactSwipeEnd !== undefined || !!ds.lane
    const cancelDeclared = ds.reactCancel !== undefined || pressDeclared || swipeDeclared

    return {
      element: el,
      laneId: ds.lane || null,
      direction: ds.direction || null,
      actionId: ds.action || null,
      pressable: pressDeclared,
      swipeable: swipeDeclared,
      reactions: {
        press: pressDeclared,
        release: pressDeclared || ds.reactRelease !== undefined,
        swipeStart: swipeDeclared || ds.reactSwipeStart !== undefined,
        swipe: swipeDeclared || ds.reactSwipe !== undefined,
        swipeEnd: swipeDeclared || ds.reactSwipeEnd !== undefined,
        cancel: cancelDeclared
      }
    }
  }
}
