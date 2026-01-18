import { APP_SETTINGS } from "../config/appSettings"
import { computed } from 'vue'
/* -------------------------
   Device info (works for web and APK)
-------------------------- */


// Default phone specs (raw pixels & logical density)
const defaultDeviceRaw = APP_SETTINGS.rawPhoneValues
// Compute CSS pixels (same as Kotlin)
const defaultDevice = {
  width: defaultDeviceRaw.width / defaultDeviceRaw.density,
  height: defaultDeviceRaw.height / defaultDeviceRaw.density,
  density: defaultDeviceRaw.density
}

// Use injected window.__DEVICE if available (DebugWrapper or APK)
export const device = computed(() => {
  if (window.__DEVICE) return window.__DEVICE
  return defaultDevice
})

// Compute scaling to fit current viewport (for web)
export const scale = computed(() => {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let scaleFactor = vh / device.value.height // height-first
  if (device.value.width * scaleFactor > vw) {
    scaleFactor = vw / device.value.width // shrink to fit width
  }
  return scaleFactor
})

// CSS pixels * scale for swipe math
const scaledWidth = computed(() => device.value.width * scale.value)
const scaledHeight = computed(() => device.value.height * scale.value)

export function getAxisSize(axis) {
  if (axis === 'horizontal' || axis === 'x') return scaledWidth.value
  if (axis === 'vertical' || axis === 'y') return scaledHeight.value
  return 0
}

export function normalizeSwipeDelta(delta) {
  return delta / scale.value
}