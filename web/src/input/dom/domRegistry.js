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
  // Core intent resolver
  // ------------------------
  /**
   * Returns the top-most element declaring gesture intent at x, y
   * Includes lane/action info and reaction booleans.
   */
  findElementAt(x, y) {
    const el = document.elementsFromPoint(x, y).find(el => {
      const ds = el.dataset || {}
      return (
        ds.lane !== undefined ||
        ds.action !== undefined ||
        ds.press !== undefined ||
        ds.swipe !== undefined ||
        ds.swipeType !== undefined ||
        ds.reactPress !== undefined ||
        ds.reactPressRelease !== undefined ||
        ds.reactPressCancel !== undefined ||
        ds.reactSwipeStart !== undefined ||
        ds.reactSwipe !== undefined ||
        ds.reactSwipeCommit !== undefined ||
        ds.reactSwipeRevert !== undefined ||
        ds.reactSelected !== undefined ||
        ds.reactDeselected !== undefined
      )
    })

    return el ? this.readFlags(el) : null
  },

  // ------------------------
  // Lane / axis helpers
  // ------------------------
  findLaneByAxis(x, y, inputAxis) {
    const el = document.elementsFromPoint(x, y).find(el => {
      const ds = el.dataset
      return ds?.lane && ds?.axis && (ds.axis === inputAxis || ds.axis === 'both')
    })
    return el ? this.readFlags(el) : null
  },

  // ------------------------
  // Core flag reader
  // ------------------------
  /**
   * Reads a DOM element and returns a full data packet:
   * element, lane/action info, press/swipe/select booleans, reaction map.
   */
  readFlags(el) {
    const ds = el.dataset || {}

    const laneId = ds.lane || null
    const axis = ds.axis || null
    const swipeType = ds.swipeType || null
    const actionId = ds.action || null

    const laneValid = !laneId || (axis && swipeType)

    // Derived booleans
    const pressable = !!(ds.press !== undefined || ds.reactPress !== undefined || ds.reactPressRelease !== undefined || ds.action !== undefined)
    const swipeable = !!(ds.swipe !== undefined || ds.reactSwipe !== undefined || ds.reactSwipeStart !== undefined || ds.reactSwipeCommit !== undefined || ds.reactSwipeRevert !== undefined || (laneId && laneValid))
    const cancelable = !!(ds.reactPressCancel !== undefined || pressable || swipeable)
    const selectable = !!(ds.reactSelected !== undefined || pressable || swipeable)
    const deselectable = !!(ds.reactDeselected !== undefined || selectable)

    const reactions = {
      press: pressable,
      pressRelease: pressable || ds.reactPressRelease !== undefined,
      pressCancel: cancelable,
      swipeStart: swipeable || ds.reactSwipeStart !== undefined,
      swipe: swipeable || ds.reactSwipe !== undefined,
      swipeCommit: swipeable || ds.reactSwipeCommit !== undefined,
      swipeRevert: swipeable || ds.reactSwipeRevert !== undefined,
      select: selectable,
      deselect: deselectable
    }

    return {
      element: el,
      laneId: laneValid ? laneId : null,
      axis: laneValid ? axis : null,
      swipeType: laneValid ? swipeType : null,
      actionId,
      pressable,
      swipeable,
      selectable,
      deselectable,
      reactions
    }
  }
}