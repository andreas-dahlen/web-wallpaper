//composables/useScale.js
import { onMounted, onBeforeUnmount } from 'vue'
import { APP_SETTINGS } from '../config/appSettings'

let currentScale = 1

export function useScale({ targetId = 'app' } = {}) {

  function getBaseSize() {
    return {
      width: APP_SETTINGS.design.width,
      height: APP_SETTINGS.design.height
    }
  }

  function applyScale() {
    const { width, height } = getBaseSize()
    if (!width || !height) return

    const scale = Math.min(
      window.innerWidth / width,
      window.innerHeight / height
    )

    currentScale = scale
    window.__APP_SCALE = scale

    const el = document.getElementById(targetId)
    if (el) {
      el.style.transform = `scale(${scale})`
      el.style.transformOrigin = '0 0' // Scale from top-left for correct coordinate mapping
    }
  }

  function onMetrics() {
    applyScale()
  }

  onMounted(() => {
    applyScale()
    window.addEventListener('layout:refresh', applyScale)
    window.addEventListener('phone:metrics', onMetrics)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('layout:refresh', applyScale)
    window.removeEventListener('phone:metrics', onMetrics)
  })

  return {
    getScale: () => currentScale
  }
}

