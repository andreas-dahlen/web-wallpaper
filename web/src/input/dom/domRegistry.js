/**
 * domRegistry.js - Single DOM authority
 *
 * Responsibilities:
 * - Read data-* attributes
 * - Resolve elements and declared reactions
 * - Never mutates DOM, never triggers callbacks
 */
// import { log } from '../../debug/functions'

export const domRegistry = {
  findElementAt(x, y) {
    const element = document.elementsFromPoint(x, y)[0] || null
    if(!element) return null
    return {
      element,
      ...this.readFlags(element)
    }
  },

  findLaneAt(x, y) {
    const el = document.elementsFromPoint(x, y)
      .find(el => el.dataset?.lane)

    if (!el) return null

    const laneId = el.dataset.lane
    const axis = el.dataset.direction || null
    const swipeType = el.dataset.swipeType || null

    if (!laneId || !axis || !swipeType) return null

    return { element: el, laneId, axis, swipeType }
  },

  findLaneByAxis(x, y, axis) {
    const el = document.elementsFromPoint(x, y).find(el => {
      const ds = el.dataset || {}
      if (!ds.lane || !ds.direction || !ds.swipeType) return false
      return ds.direction === axis || ds.direction === 'both'
    })

    if (!el) return null

    return {
      element: el,
      ...this.readFlags(el)
    }
  },

  findActionAt(x, y) {
    const el = document.elementsFromPoint(x, y)
      .find(el => el.dataset?.action)

    if (!el) return null

    return {
      element: el,
      actionId: el.dataset.action
    }
  },

  readFlags(el) {
    if (!el) return {}

    const ds = el.dataset || {}
    return {
      press: ds.press !== undefined,
      swipe: ds.swipe !== undefined,
      select: ds.select !== undefined,

      react: {
        press: ds.reactPress !== undefined,
        pressRelease: ds.reactPressRelease !== undefined,
        pressCancel: ds.reactPressCancel !== undefined,
        swipeStart: ds.reactSwipeStart !== undefined,
        swipe: ds.reactSwipe !== undefined,
        swipeCommit: ds.reactSwipeCommit !== undefined,
        swipeRevert: ds.reactSwipeRevert !== undefined,
        select: ds.reactSelected !== undefined,
        deselect: ds.reactDeselected !== undefined
      }
    }
  }
}