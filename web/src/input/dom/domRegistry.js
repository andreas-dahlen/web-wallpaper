/**
 * domRegistry.js - Single DOM authority
 *
 * Responsibilities:
 * - Read data-* attributes
 * - Resolve elements and declared reactions
 * - Never mutates DOM, never triggers callbacks
 */
import { log } from '../../debug/functions'

export const domRegistry = {
  // ------------------------
  // Lane-switch helpers
  // ------------------------
  swipeAllowedForType(target, axis) {
    if (!target?.element) return false
    if (target.swipeType === 'drag') return true

    if (!target.axis) return false
    if (target.axis === 'both') return true
    return target.axis === axis
  },

  // ------------------------
  // Lane-based helpers
  // ------------------------
  findLaneAt(x, y) {
    const elements = document.elementsFromPoint(x, y)
    const el = elements.find(el => el.dataset?.lane)

    if (!el) {
      log('dom', 'lane not found')
      return null
    }

    const axis = el.dataset.direction
    const swipeType = el.dataset.swipeType

    if (!axis || !swipeType) {
      console.warn('[domRegistry] lane missing direction/swipeType', el)
      return null
    }

    log('dom', 'found lane:', el)

    return {
      laneId: el.dataset.lane,
      axis,
      swipeType,
      element: el
    }
  },

  findLaneByAxis(x, y, axis) {
    const elements = document.elementsFromPoint(x, y)
    const el = elements.find(el => {
      const ds = el.dataset || {}
      if (!ds.lane || !ds.direction || !ds.swipeType) return false
      if (ds.direction === 'both') return true
      return ds.direction === axis
    })

    if (!el) return null

    log('dom', 'found lane by axis:', el.dataset.direction, el)

    return {
      laneId: el.dataset.lane,
      axis: el.dataset.direction,
      swipeType: el.dataset.swipeType,
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

    log('dom', 'found action:', el, el.dataset.action)

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
   * Returns { element, laneId?, axis?, actionId?, pressable?, swipeable?, selectable?, deselectable?, reactions }
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
    const axis = ds.direction || null
    const swipeType = ds.swipeType || null

    const isLane = Boolean(laneId)
    const laneValid = !isLane || (axis && swipeType)

    if (isLane && !laneValid) {
      console.warn('[domRegistry] lane missing direction/swipeType', el)
    }

    const pressDeclared =
      ds.press !== undefined ||
      ds.reactPress !== undefined ||
      ds.reactPressRelease !== undefined ||
      ds.action !== undefined

    const hasSwipeReaction =
      ds.swipe !== undefined ||
      ds.reactSwipe !== undefined ||
      ds.reactSwipeStart !== undefined ||
      ds.reactSwipeCommit !== undefined ||
      ds.reactSwipeRevert !== undefined

    const swipeDeclared = hasSwipeReaction || (laneId && laneValid)
    const cancelDeclared = ds.reactPressCancel !== undefined || pressDeclared || swipeDeclared
    const selectDeclared = ds.reactSelected !== undefined || pressDeclared || swipeDeclared
    const deselectDeclared = ds.reactDeselected !== undefined || selectDeclared

    return {
      element: el,
      laneId: laneValid ? laneId : null,
      axis: laneValid ? axis : null,
      actionId: ds.action || null,
      swipeType: laneValid ? swipeType : null,
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