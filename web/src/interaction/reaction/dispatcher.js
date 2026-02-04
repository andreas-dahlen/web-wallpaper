// dispatcher.js
/**
 * Single choke point for applying reactions to state.
 *
 * Contract:
 * - Receives descriptors with optional reaction payloads
 * - Applies carousel reactions to carouselState
 * - Applies drag reactions to dragState
 * - Applies slider reactions to sliderState
 * - Updates DOM attributes & dispatches events
 * - Does NOT contain decision logic
 */
import {
  startDrag as startCarouselDrag,
  applyOffset as applyCarouselOffset,
  commitSwipe as commitCarousel,
  revertSwipe as revertCarousel
} from '../state/carouselState'

import {
  setDragPosition,
  getDragPosition
} from '../state/dragState'

import {
  startDrag as startSliderDrag,
  applyOffset as applySliderOffset,
  commitSlider
} from '../state/sliderState'

/* -------------------------------------------------
   DOM helpers
------------------------------------------------- */
function setAttr(element, key, value) {
  if (!element) return
  if (value === null || value === undefined || value === false) {
    element.removeAttribute(key)
  } else {
    element.setAttribute(key, String(value))
  }
}

function dispatchEvent(element, descriptor) {
  if (!element) return
  element.dispatchEvent(new CustomEvent('reaction', { detail: descriptor }))
}

/* -------------------------------------------------
   Carousel domain reaction handlers
------------------------------------------------- */
function handleCarouselReaction(desc) {
  const { reaction, laneId, delta, direction } = desc
  switch (reaction) {
    case 'swipeStart':
      startCarouselDrag(laneId)
      break
    case 'swipe':
      applyCarouselOffset(laneId, delta)
      break
    case 'swipeCommit':
      commitCarousel(laneId, direction, delta)
      break
    case 'swipeRevert':
      revertCarousel(laneId)
      break
  }
}

/* -------------------------------------------------
   Drag domain reaction handlers
------------------------------------------------- */
function handleDragReaction(desc) {
  const { reaction, laneId, deltaX, deltaY } = desc
  switch (reaction) {
    case 'swipeStart':
      // Drag start - no state change needed (position is persisted)
      break
    case 'swipe':
      // Apply offset during drag - renderer reads delta directly from descriptor
      break
    case 'swipeCommit': {
      // Persist final position
      const current = getDragPosition(laneId)
      setDragPosition(laneId, {
        x: current.x + deltaX,
        y: current.y + deltaY
      })
      break
    }
  }
}

/* -------------------------------------------------
   Slider domain reaction handlers
------------------------------------------------- */
function handleSliderReaction(desc) {
  const { reaction, laneId, delta } = desc
  switch (reaction) {
    case 'swipeStart':
      startSliderDrag(laneId)
      break
    case 'swipe':
      applySliderOffset(laneId, delta)
      break
    case 'swipeCommit':
      commitSlider(laneId, delta)
      break
  }
}

/* -------------------------------------------------
   DOM / UI attribute handlers
------------------------------------------------- */
const typeHandlers = {
  press: (el) => setAttr(el, 'data-pressed', true),
  pressRelease: (el) => setAttr(el, 'data-pressed', null),
  pressCancel: (el) => setAttr(el, 'data-pressed', null),
  swipeStart: (el) => setAttr(el, 'data-swiping', true),
  swipeCommit: (el) => setAttr(el, 'data-swiping', null),
  swipeRevert: (el) => setAttr(el, 'data-swiping', null),
  swipe: () => {}
}

/* -------------------------------------------------
   Dispatcher
------------------------------------------------- */
export const dispatcher = {
  handle(descriptor) {
    if (!descriptor || !descriptor.element) return

    // 1️⃣ Apply domain reaction if present
    if (descriptor.reaction) {
      switch (descriptor.swipeType) {
        case 'carousel':
          handleCarouselReaction(descriptor)
          break
        case 'drag':
          handleDragReaction(descriptor)
          break
        case 'slider':
          handleSliderReaction(descriptor)
          break
      }
    }
    // 2️⃣ Apply DOM / UI attributes
    typeHandlers[descriptor.type]?.(descriptor.element)

    // 3️⃣ Dispatch custom event
    dispatchEvent(descriptor.element, descriptor)
  }
}