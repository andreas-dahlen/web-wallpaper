// dispatcher.js
/**
 * Single choke point for applying reactions to state.
 *
 * Contract:
 * - Receives descriptors with optional reaction payloads
 * - Applies carousel reactions to carouselState
 * - Updates DOM attributes & dispatches events
 * - Does NOT contain decision logic
 */

import {
  startDrag,
  applyOffset,
  commitSwipe,
  revertSwipe
} from '../state/carouselState'

// --------------------------
// DOM helpers
// --------------------------
function setAttr(el, key, value) {
  if (!el) return
  if (value === null || value === false || value === undefined) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, String(value))
  }
}

function dispatchEvent(el, descriptor) {
  if (!el) return
  el.dispatchEvent(new CustomEvent('reaction', { detail: descriptor }))
}

// --------------------------
// Domain reaction handlers
// --------------------------
const domainHandlers = {
  carousel: (reaction) => {
    switch (reaction.type) {
      case 'carousel:dragStart':
        startDrag(reaction.laneId)
        break
      case 'carousel:offset':
        applyOffset(reaction.laneId, reaction.offset)
        break
      case 'carousel:commit':
        commitSwipe(reaction.laneId, reaction.direction, reaction.offset)
        break
      case 'carousel:revert':
        revertSwipe(reaction.laneId)
        break
    }
  }
  // add other domains here in the future
}

// --------------------------
// DOM / UI attribute handlers
// --------------------------
const typeHandlers = {
  press: (desc) => setAttr(desc.element, 'data-pressed', true),
  pressRelease: (desc) => setAttr(desc.element, 'data-pressed', null),
  pressCancel: (desc) => setAttr(desc.element, 'data-pressed', null),
  swipeStart: (desc) => setAttr(desc.element, 'data-swiping', true),
  swipeCommit: (desc) => setAttr(desc.element, 'data-swiping', null),
  swipeRevert: (desc) => setAttr(desc.element, 'data-swiping', null),
  swipe: (desc) => {} // no attribute change
}

// --------------------------
// Dispatcher
// --------------------------
export const dispatcher = {
  handle(descriptor) {
    if (!descriptor || !descriptor.element) return

    // 1️⃣ Apply domain reaction if present
    if (descriptor.reaction) {
      const domain = descriptor.reaction.domain || 'carousel' // default domain carousel
      const handler = domainHandlers[domain]
      if (handler) handler(descriptor.reaction)
    }

    // 2️⃣ Apply DOM / UI attributes
    const typeHandler = typeHandlers[descriptor.type]
    if (typeHandler) typeHandler(descriptor)

    // 3️⃣ Dispatch event
    dispatchEvent(descriptor.element, descriptor)
  }
}