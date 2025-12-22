import { onMounted, onBeforeUnmount } from 'vue'

let currentScale = 1

export function useScale({ baseWidth = 364, baseHeight = 800, targetId = 'app' } = {}) {
  function applyScale() {
    const scale = Math.min(
      window.innerWidth / baseWidth,
      window.innerHeight / baseHeight
    )
    currentScale = scale
    window.__APP_SCALE = scale // update global scale for nativeBridge

    const el = document.getElementById(targetId)
    if (el) el.style.transform = `scale(${scale})`
  }

  onMounted(() => {
    applyScale()
    window.addEventListener('resize', applyScale)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', applyScale)
  })

  return {
    getScale: () => currentScale
  }
}
