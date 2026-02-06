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
import { state } from '../state/stateManager'

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
function handleReaction(desc) {
  const { reaction, swipeType } = desc
  switch (reaction) {
    case 'swipeStart':
      state.swipeStart(swipeType, desc)
      break
    case 'swipe':
      state.swipe(swipeType, desc)
      break
    case 'swipeCommit':
      state.swipeCommit(swipeType, desc)
      break
    case 'swipeRevert':
      state.swipeRevert(swipeType, desc)
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
  swipe: () => { }
}

/* -------------------------------------------------
   Dispatcher
------------------------------------------------- */
export const dispatcher = {
  handle(descriptor) {
    if (!descriptor || !descriptor.element) return

    // 1️⃣ Apply domain reaction if present
    if (descriptor.reaction) {
      handleReaction(descriptor)
    }
    // 2️⃣ Apply DOM / UI attributes
    typeHandlers[descriptor.type]?.(descriptor.element)

    // 3️⃣ Dispatch custom event
    dispatchEvent(descriptor.element, descriptor)
  }
}
