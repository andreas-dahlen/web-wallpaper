/**
 * domRegistry.js - Single DOM authority
 *
 * Responsibilities:
 * - Read data-* attributes
 * - Resolve elements and declared reactions
 * - Never mutates DOM, never triggers callbacks
 */

export const domRegistry = {
  // ------------------------
  // Lane-based helpers
  // ------------------------
  findLaneAt(x, y) {
    const elements = document.elementsFromPoint(x, y)
    const el = elements.find(el => el.dataset?.lane)
    if (!el) return null
    const dir = el.dataset.direction
    const type = el.dataset.swipeType
    if (!dir || !type) {
      console.warn('[domRegistry] lane missing direction/swipeType', el)
      return null
    }
    return {
      laneId: el.dataset.lane,
      direction: dir,
      swipeType: type,
      element: el
    }
  },

  findLaneByAxis(x, y, axis) {
    const elements = document.elementsFromPoint(x, y)
    const el = elements.find(el => {
      const ds = el.dataset || {}
      const lane = ds.lane
      const dir = ds.direction
      const type = ds.swipeType
      if (!lane || !dir || !type) return false
      if (dir === 'both') return true
      return dir === axis
    })
    if (!el) return null
    const dir = el.dataset.direction
    const type = el.dataset.swipeType
    if (!dir || !type) {
      console.warn('[domRegistry] lane missing direction/swipeType', el)
      return null
    }
    return {
      laneId: el.dataset.lane,
      direction: dir,
      swipeType: type,
      element: el
    }
  },

  // ------------------------
  // Action-based helpers
  // ------------------------
  findActionAt(x, y) {
    const elements = document.elementsFromPoint(x, y)
    const el = elements.find(el => el.dataset?.action)
    if (!el) return null
    return {
      actionId: el.dataset.action,
      element: el
    }
  },

  // ------------------------
  // Core intent resolver
  // ------------------------
  /**
   * Resolve the top-most element that declares intent.
   * Returns { element, laneId?, direction?, actionId?, pressable?, swipeable?, selectable?, deselectable?, reactions }
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
        ds.swipeType !== undefined ||
        ds.reactPress !== undefined ||
        ds.reactPressRelease !== undefined ||
        ds.reactPressCancel !== undefined ||
        ds.reactSwipe !== undefined ||
        ds.reactSwipeStart !== undefined ||
        ds.reactSwipeCommit !== undefined ||
        ds.reactSwipeRevert !== undefined ||
        ds.reactSelected !== undefined ||
        ds.reactDeselected !== undefined
      )
    })

    if (!el) return null
    const ds = el.dataset || {}

    const laneId = ds.lane || null
    const laneDirection = ds.direction || null
    const laneSwipeType = ds.swipeType || null
    const laneValid = !laneId || (laneDirection && laneSwipeType)
    if (laneId && !laneValid) {
      console.warn('[domRegistry] lane missing direction/swipeType', el)
    }

    const pressDeclared = ds.press !== undefined || ds.reactPress !== undefined || ds.reactPressRelease !== undefined || ds.action !== undefined
    const swipeDeclared = ds.swipe !== undefined || ds.reactSwipe !== undefined || ds.reactSwipeStart !== undefined || ds.reactSwipeCommit !== undefined || ds.reactSwipeRevert !== undefined || (laneId && laneValid)
    const cancelDeclared = ds.reactPressCancel !== undefined || pressDeclared || swipeDeclared
    const selectDeclared = ds.reactSelected !== undefined || pressDeclared || swipeDeclared
    const deselectDeclared = ds.reactDeselected !== undefined || selectDeclared

    return {
      element: el,
      laneId: laneValid ? laneId : null,
      direction: laneValid ? laneDirection : null,
      actionId: ds.action || null,
      swipeType: laneValid ? laneSwipeType : null,
      pressable: pressDeclared,
      swipeable: swipeDeclared,
      selectable: selectDeclared,
      deselectable: deselectDeclared,
      reactions: {
        press: pressDeclared,
        pressRelease: pressDeclared || ds.reactPressRelease !== undefined,
        pressCancel: cancelDeclared,
        swipeStart: swipeDeclared || ds.reactSwipeStart !== undefined,
        swipe: swipeDeclared || ds.reactSwipe !== undefined,
        swipeCommit: swipeDeclared || ds.reactSwipeCommit !== undefined,
        swipeRevert: swipeDeclared || ds.reactSwipeRevert !== undefined,
        select: selectDeclared,
        deselect: deselectDeclared
      }
    }
  }
}