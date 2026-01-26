import { APP_SETTINGS } from "../config/appSettings"
import { computed } from 'vue'
import { log } from '../debug/functions'
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

// Validate that a device payload has numeric, finite dimensions/density.
function sanitizeDevice(payload) {
  const fallback = { ...defaultDevice }
  if (!payload) return fallback

  const width = Number(payload.width)
  const height = Number(payload.height)
  const density = Number(payload.density)

  const valid = Number.isFinite(width) && Number.isFinite(height) && Number.isFinite(density) && density > 0
  if (!valid) {
    log('scale', '[sizeState] Invalid __DEVICE payload, falling back to defaults', payload)
    return fallback
  }

  return Object.freeze({ width, height, density })
}

// Use injected window.__DEVICE if available (DebugWrapper or APK)
export const device = computed(() => sanitizeDevice(window.__DEVICE || defaultDevice))

// Compute scaling to fit current viewport (for web)
export const scale = computed(() => {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let scaleFactor = device.value.height ? (vh / device.value.height) : 1 // height-first
  if (device.value.width * scaleFactor > vw) {
    scaleFactor = device.value.width ? (vw / device.value.width) : scaleFactor // shrink to fit width
  }

  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0) {
    log('scale', '[sizeState] Invalid scaleFactor computed, defaulting to 1', { scaleFactor, vw, vh, device: device.value })
    return 1
  }

  return scaleFactor
})

// CSS pixels * scale for swipe math
const scaledWidth = computed(() => device.value.width * scale.value)
const scaledHeight = computed(() => device.value.height * scale.value)

export function getAxisSize(axis) {
  if (axis === 'horizontal') return scaledWidth.value
  if (axis === 'vertical') return scaledHeight.value
  return 0
}

export function normalizeSwipeDelta(delta) {
  return delta / scale.value
}