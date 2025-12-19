import { onMounted, onBeforeUnmount } from 'vue'

export function useScale({
  baseWidth = 364,
  baseHeight = 800,
  targetId = 'app'
} = {}) {
  function applyScale() {
    const scale = Math.min(
      window.innerWidth / baseWidth,
      window.innerHeight / baseHeight
    )

    const el = document.getElementById(targetId)
    if (el) {
      el.style.transform = `scale(${scale})`
    }
  }

  onMounted(() => {
    applyScale()
    window.addEventListener('resize', applyScale)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', applyScale)
  })
}
