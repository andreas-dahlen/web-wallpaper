import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useInput({ swipeThreshold = 40 } = {}) {
  const isDown = ref(false)
  const startX = ref(0)
  const startY = ref(0)
  const x = ref(0)
  const y = ref(0)

  // --- Global swipe callbacks ---
  const swipeCallbacks = { left: [], right: [], up: [], down: [] }

  // --- Global pointer down/up callbacks ---
  const buttonDownCallbacks = []
  const buttonUpCallbacks = []

  // --- Per-element callbacks ---
  const elementDownCallbacks = new Map()
  const elementUpCallbacks = new Map()

  function onPointerDown(e) {
    isDown.value = true
    startX.value = e.clientX
    startY.value = e.clientY
    x.value = e.clientX
    y.value = e.clientY

    buttonDownCallbacks.forEach(cb => cb(e))

    // trigger element-specific callbacks
    elementDownCallbacks.forEach((cbs, el) => {
      if (el.contains(e.target)) cbs.forEach(cb => cb(e))
    })
  }

  function onPointerMove(e) {
    if (!isDown.value) return
    const dx = e.clientX - startX.value
    const dy = e.clientY - startY.value
    x.value = e.clientX
    y.value = e.clientY

    let direction = null
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
      direction = dx > 0 ? 'right' : 'left'
    } else if (Math.abs(dy) > swipeThreshold) {
      direction = dy > 0 ? 'down' : 'up'
    }

    if (direction) {
      swipeCallbacks[direction].forEach(cb => cb({ dx, dy }))
      startX.value = e.clientX
      startY.value = e.clientY
    }
  }

  function onPointerUp(e) {
    isDown.value = false
    buttonUpCallbacks.forEach(cb => cb(e))

    elementUpCallbacks.forEach((cbs, el) => {
      if (el.contains(e.target)) cbs.forEach(cb => cb(e))
    })
  }

  function onSwipe(dir, cb) {
    if (swipeCallbacks[dir]) swipeCallbacks[dir].push(cb)
  }

  function onButtonDown(cb) {
    buttonDownCallbacks.push(cb)
  }

  function onButtonUp(cb) {
    buttonUpCallbacks.push(cb)
  }

  // --- Per-element registration ---
  function registerElement(el, { onDown, onUp } = {}) {
    if (onDown) {
      if (!elementDownCallbacks.has(el)) elementDownCallbacks.set(el, [])
      elementDownCallbacks.get(el).push(onDown)
    }
    if (onUp) {
      if (!elementUpCallbacks.has(el)) elementUpCallbacks.set(el, [])
      elementUpCallbacks.get(el).push(onUp)
    }
  }

  onMounted(() => {
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  })

  return {
    onSwipe,
    onButtonDown,
    onButtonUp,
    registerElement,
    isDown,
    x,
    y
  }
}
