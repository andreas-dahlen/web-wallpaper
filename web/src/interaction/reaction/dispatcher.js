// dispatcher.js — intentionally boring

function setAttr(el, key, value) {
  if (!el) return
  if (value === null || value === false || value === undefined) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, String(value))
  }
}

function dispatch(descriptor) {
  descriptor.element.dispatchEvent(
    new CustomEvent('reaction', { detail: descriptor })
  )
}

export const dispatcher = {
  handle(descriptor) {
    if (!descriptor || !descriptor.element) return

    switch (descriptor.type) {

      // ---------- PRESS ----------
      case 'press':
        setAttr(descriptor.element, 'data-pressed', true)
        dispatch(descriptor)
        break

      case 'pressRelease':
      case 'pressCancel':
        setAttr(descriptor.element, 'data-pressed', null)
        dispatch(descriptor)
        break

      // ---------- SWIPE ----------
      case 'swipeStart':
        setAttr(descriptor.element, 'data-swiping', true)
        dispatch(descriptor)
        break

      case 'swipe':
        dispatch(descriptor)
        break

      case 'swipeCommit':
      case 'swipeRevert':
        setAttr(descriptor.element, 'data-swiping', null)
        dispatch(descriptor)
        break
    }
  }
}