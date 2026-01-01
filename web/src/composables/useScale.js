//composables/useScale.js
import { onMounted, onBeforeUnmount } from 'vue'
import { APP_SETTINGS } from '../config/appSettings'

let currentScale = 1

export function useScale({ targetId = 'app' } = {}) {
  const { width, height } = APP_SETTINGS.phone

  function applyScale() {
    const scale = Math.min(
      window.innerWidth / width,
      window.innerHeight / height
    )

    currentScale = scale
    window.__APP_SCALE = scale

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

