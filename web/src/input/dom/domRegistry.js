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
    const elements = document.elementsFromPoint(x, y)

    const el = elements.find(el => {
      const ds = el.dataset || {}

      return (
        ds.lane !== undefined ||
        ds.action !== undefined ||
        ds.press !== undefined ||
        ds.swipe !== undefined ||
        ds.select !== undefined ||
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

    if (!el) return null

    return {
      element: el,
      ...this.readFlags(el)
    }
  },

  // findLaneAt(x, y) {
  //   const el = document.elementsFromPoint(x, y)
  //     .find(el => el.dataset?.lane)

  //   if (!el) return null

  //   const laneId = el.dataset.lane
  //   const axis = el.dataset.direction || null
  //   const swipeType = el.dataset.swipeType || null

  //   if (!laneId || !axis || !swipeType) return null

  //   return { element: el, laneId, axis, swipeType }
  // },

  findLaneByAxis(x, y, axis) {
    const elements = document.elementsFromPoint(x, y)

    const el = elements.find(el => {
      const ds = el.dataset || {}
      if (!ds.lane || !ds.direction || !ds.swipeType) return false
      return ds.direction === axis || ds.direction === 'both'
    })

    if (!el) return null

    return {
      element: el,
      laneId: el.dataset.lane,
      direction: el.dataset.direction,
      swipeType: el.dataset.swipeType,
      ...this.readFlags(el)
    }
  },

  // findActionAt(x, y) {
  //   const el = document.elementsFromPoint(x, y)
  //     .find(el => el.dataset?.action)

  //   if (!el) return null

  //   return {
  //     element: el,
  //     actionId: el.dataset.action
  //   }
  // },

  readFlags(el) {
    const ds = el.dataset || {}

    const isLane =
      ds.lane !== undefined &&
      ds.direction !== undefined &&
      ds.swipeType !== undefined

    const swipeDeclared =
      ds.swipe !== undefined ||
      ds.reactSwipe !== undefined ||
      ds.reactSwipeStart !== undefined ||
      ds.reactSwipeCommit !== undefined ||
      ds.reactSwipeRevert !== undefined ||
      isLane

    const pressDeclared =
      ds.press !== undefined ||
      ds.reactPress !== undefined ||
      ds.reactPressRelease !== undefined ||
      ds.action !== undefined

    const selectDeclared =
      ds.reactSelected !== undefined ||
      ds.reactDeselected !== undefined

    return {
      press: pressDeclared,
      swipe: swipeDeclared,
      select: selectDeclared,

      reaction: {
        press: pressDeclared,
        pressRelease: pressDeclared || ds.reactPressRelease !== undefined,
        pressCancel: ds.reactPressCancel !== undefined || pressDeclared || swipeDeclared,

        swipeStart: swipeDeclared || ds.reactSwipeStart !== undefined,
        swipe: swipeDeclared || ds.reactSwipe !== undefined,
        swipeCommit: swipeDeclared || ds.reactSwipeCommit !== undefined,
        swipeRevert: swipeDeclared || ds.reactSwipeRevert !== undefined,

        select: selectDeclared,
        deselect: selectDeclared
      }
    }
  }
}