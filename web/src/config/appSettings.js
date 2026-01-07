// config/appSettings.js

const DESIGN_FALLBACK = { width: 364, height: 800, dpr: 1 }
const TYPOGRAPHY_FALLBACK = { baseSize: 16, minSize: 14, maxSize: 18 }

function resolveRuntimeViewport() {
  if (typeof window === 'undefined') return { ...DESIGN_FALLBACK }

  const injected = window.__ANDROID_SCREEN__
  const injectedWidth = Number(injected?.width)
  const injectedHeight = Number(injected?.height)
  const injectedScale = Number(injected?.scale)

  if (Number.isFinite(injectedWidth) && injectedWidth > 0 && Number.isFinite(injectedHeight) && injectedHeight > 0) {
    return {
      width: injectedWidth,
      height: injectedHeight,
      dpr: Number.isFinite(injectedScale) && injectedScale > 0 ? injectedScale : (window.devicePixelRatio || DESIGN_FALLBACK.dpr)
    }
  }

  const width = Math.max(window.innerWidth || 0, 0) || DESIGN_FALLBACK.width
  const height = Math.max(window.innerHeight || 0, 0) || DESIGN_FALLBACK.height
  const dpr = window.devicePixelRatio || DESIGN_FALLBACK.dpr

  return { width, height, dpr }
}

export const APP_SETTINGS = {
  design: {
    width: DESIGN_FALLBACK.width,
    height: DESIGN_FALLBACK.height,
    dpr: DESIGN_FALLBACK.dpr,
    orientation: 'portrait'
  },

  typography: {
    baseSize: TYPOGRAPHY_FALLBACK.baseSize,
    minSize: TYPOGRAPHY_FALLBACK.minSize,
    maxSize: TYPOGRAPHY_FALLBACK.maxSize
  },

  ui: {
    laneHeight: 267,
    swipeAnimationMs: 250,
    swipeSpeedMultiplier: 1.2,
    laneLengths: {
      top: 3,
      mid: 3,
      bottom: 3
    }
  },

  input: {
    swipeThreshold: 8,
    swipeViewChangeThreshold: 40
  }
}

export const units = {
  px: value => `${value}px`,
  rem: value => `${value / APP_SETTINGS.typography.baseSize}rem`,
  vw: value => `${(value / APP_SETTINGS.design.width) * 100}vw`,
  vh: value => `${(value / APP_SETTINGS.design.height) * 100}vh`,
  clampPx: (minPx, preferredPx, maxPx) => `clamp(${units.rem(minPx)}, ${units.rem(preferredPx)}, ${units.rem(maxPx)})`
}

export function env() {
  if (typeof window === 'undefined') return { ...DESIGN_FALLBACK, innerWidth: DESIGN_FALLBACK.width, innerHeight: DESIGN_FALLBACK.height, visualWidth: DESIGN_FALLBACK.width, visualHeight: DESIGN_FALLBACK.height, visualScale: 1, orientation: 'portrait' }

  const vv = window.visualViewport
  const innerWidth = window.innerWidth || DESIGN_FALLBACK.width
  const innerHeight = window.innerHeight || DESIGN_FALLBACK.height
  const visualWidth = vv?.width ?? innerWidth
  const visualHeight = vv?.height ?? innerHeight
  const visualScale = vv?.scale ?? 1
  const dpr = window.devicePixelRatio || DESIGN_FALLBACK.dpr
  const orientation = visualWidth >= visualHeight ? 'landscape' : 'portrait'

  return { innerWidth, innerHeight, visualWidth, visualHeight, visualScale, dpr, orientation }
}

// Debug config is now optional - most debug features removed for performance
export const DEBUG = {
  enabled: false,
  gestures: false
}

function writeCssVars() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--design-width', `${APP_SETTINGS.design.width}px`)
  root.style.setProperty('--design-height', `${APP_SETTINGS.design.height}px`)
  root.style.setProperty('--design-dpr', `${APP_SETTINGS.design.dpr}`)
  root.style.setProperty('--base-font-size', `${APP_SETTINGS.typography.baseSize}px`)
  root.style.setProperty('--font-size-min', `${APP_SETTINGS.typography.minSize}px`)
  root.style.setProperty('--font-size-max', `${APP_SETTINGS.typography.maxSize}px`)
  root.style.setProperty('--lane-height', `${APP_SETTINGS.ui.laneHeight}px`)
}

export function applyDesignViewport({ width, height, dpr }) {
  const nextWidth = Number(width)
  const nextHeight = Number(height)
  const nextDpr = Number(dpr)

  APP_SETTINGS.design.width = Number.isFinite(nextWidth) && nextWidth > 0 ? nextWidth : APP_SETTINGS.design.width
  APP_SETTINGS.design.height = Number.isFinite(nextHeight) && nextHeight > 0 ? nextHeight : APP_SETTINGS.design.height
  APP_SETTINGS.design.dpr = Number.isFinite(nextDpr) && nextDpr > 0 ? nextDpr : (typeof window !== 'undefined' ? window.devicePixelRatio || APP_SETTINGS.design.dpr : APP_SETTINGS.design.dpr)
  APP_SETTINGS.design.orientation = APP_SETTINGS.design.width >= APP_SETTINGS.design.height ? 'landscape' : 'portrait'

  writeCssVars()

  if (typeof window !== 'undefined') {
    const detail = { ...APP_SETTINGS.design }
    window.dispatchEvent(new CustomEvent('phone:metrics', { detail }))
  }
}

const initialViewport = resolveRuntimeViewport()
applyDesignViewport(initialViewport)

if (typeof window !== 'undefined') {
  window.__applyAndroidScreen = applyDesignViewport

  if (window.__ANDROID_SCREEN__) {
    applyDesignViewport(window.__ANDROID_SCREEN__)
  }
}