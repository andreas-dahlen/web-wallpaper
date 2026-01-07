<template>
  <div class="debug-screen" :data-scale="displayScale.toFixed(3)" :class="{ 'debug-screen--disabled': !enabled, 'debug-screen--gated': isGated }">
    <div v-if="isGated" class="banner">Debug panel disabled in Android WebView (browser-only tool).</div>

    <div v-if="enabled" class="debug-toolbar">
      <div class="toolbar-grid">
        <div class="toolbar-stack">
          <div class="toolbar-row">
            <span class="label">Preset</span>
            <select v-model="selectedPreset" @change="applyPreset" class="control" :disabled="isGated">
              <option v-for="preset in presets" :key="preset.name" :value="preset.name">
                {{ preset.name }}
              </option>
            </select>
            <button class="control" @click="toggleOrientation" :disabled="isGated">Flip ({{ orientationLabel }})</button>
            <button class="control" @click="resetToEnv" :disabled="isGated">Use live env()</button>
          </div>

          <div class="toolbar-row">
            <span class="label">Viewport</span>
            <input class="control input" type="number" v-model.number="width" min="200" max="1400" step="1" aria-label="Viewport width" :disabled="isGated" />
            <span class="label">×</span>
            <input class="control input" type="number" v-model.number="height" min="200" max="1400" step="1" aria-label="Viewport height" :disabled="isGated" />

            <span class="label">DPR</span>
            <input class="control input" type="number" v-model.number="dpr" min="0.5" max="4" step="0.1" aria-label="Device pixel ratio" :disabled="isGated" />

            <span class="label">Scale</span>
            <select v-model="scaleMode" class="control" :disabled="isGated">
              <option value="fit">Fit container</option>
              <option value="manual">Manual</option>
            </select>
            <input
              v-if="scaleMode === 'manual'"
              class="control input"
              type="range"
              min="0.2"
              max="2"
              step="0.01"
              v-model.number="manualScale"
              aria-label="Manual scale"
              :disabled="isGated"
            />
            <button class="control" @click="recomputeScale" :disabled="isGated">Refit</button>
          </div>

          <div v-if="!isGated" class="toolbar-row metrics">
            <span>inner: {{ metrics.innerWidth.toFixed(0) }} × {{ metrics.innerHeight.toFixed(0) }}</span>
            <span>visualViewport: {{ metrics.visualWidth.toFixed(0) }} × {{ metrics.visualHeight.toFixed(0) }} (s={{ metrics.visualScale.toFixed(2) }})</span>
            <span>dpr: {{ metrics.dpr.toFixed(2) }} | orientation: {{ metrics.orientation }}</span>
          </div>
        </div>

        <div v-if="!isGated" class="info-panel" :class="{ 'info-panel--p3': metrics.colorGamut === 'p3', 'info-panel--hdr': metrics.dynamicRange === 'high' }">
          <div class="info-group">
            <div class="info-title">Runtime detected</div>
            <div class="info-row"><span>inner</span><strong>{{ metrics.innerWidth }} × {{ metrics.innerHeight }}</strong></div>
            <div class="info-row"><span>visualViewport</span><strong>{{ metrics.visualWidth }} × {{ metrics.visualHeight }} (s={{ metrics.visualScale }})</strong></div>
            <div class="info-row"><span>dpr</span><strong>{{ metrics.dpr }}</strong></div>
            <div class="info-row"><span>orientation</span><strong>{{ metrics.orientationType }}</strong></div>
            <div class="info-row"><span>touch</span><strong>max {{ metrics.maxTouchPoints }} | coarse {{ metrics.pointerCoarse }} | fine {{ metrics.pointerFine }} | hover {{ metrics.hover }}</strong></div>
            <div class="info-row"><span>color gamut</span><strong>{{ metrics.colorGamut }}</strong></div>
            <div class="info-row"><span>dynamic range</span><strong>{{ metrics.dynamicRange }}</strong></div>
            <div class="info-row"><span>safe-area</span><strong>t {{ metrics.safeArea.top }} r {{ metrics.safeArea.right }} b {{ metrics.safeArea.bottom }} l {{ metrics.safeArea.left }}</strong></div>
            <div class="info-row"><span>deviceMemory</span><strong>{{ metrics.deviceMemory ?? 'unknown' }}</strong></div>
            <div class="info-row"><span>connection</span><strong>{{ metrics.connection }}</strong></div>
            <div class="info-row"><span>UA</span><strong class="ua">{{ metrics.userAgent }}</strong></div>
          </div>
          <div class="info-group">
            <div class="info-title">Declared (not runtime)</div>
            <div class="info-row"><span>Device px (declared)</span><strong>{{ declaredPx.w }} × {{ declaredPx.h }}</strong></div>
            <div class="info-row"><span>Suggested CSS (est.)</span><strong>{{ suggestedCss.w }} × {{ suggestedCss.h }}</strong></div>
            <div class="info-row"><span>Display</span><strong>6.83" • 19.8:9 • 450ppi</strong></div>
            <div class="info-row"><span>Panel</span><strong>Swift AMOLED • 10-bit • sRGB/DCI-P3</strong></div>
            <div class="info-row"><span>Brightness</span><strong>800 / 1400 / 1800 nits</strong></div>
            <div class="info-row"><span>Refresh</span><strong>60/90/120/144 Hz • Touch 3000 Hz</strong></div>
            <div class="info-row"><span>Glass</span><strong>Gorilla Glass 7i</strong></div>
            <div class="info-row"><span>OS/SoC</span><strong>OOS15 • Snapdragon 8s Gen 3 • Adreno 735</strong></div>
            <div class="info-row"><span>Memory/Storage</span><strong>8/12 GB LPDDR5X • 256/512 GB UFS 3.1</strong></div>
            <div class="info-row"><span>Battery/Charge</span><strong>6800 mAh • 80W / 18W PD • 5W reverse</strong></div>
          </div>
        </div>
      </div>
    </div>

    <div class="debug-stage">
      <div class="debug-frame" ref="frameRef">
        <div class="debug-viewport" :style="viewportStyle">
          <div v-if="enabled" class="badge">
            <div>{{ resolvedWidth }} × {{ resolvedHeight }} @ dpr {{ dpr.toFixed(2) }}</div>
            <div>scale {{ displayScale.toFixed(3) }}</div>
            <div v-if="isGated">WebView gated: no design write</div>
          </div>
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { applyDesignViewport, env as readEnv } from '../config/appSettings'

// UA heuristic for WebView gating
function isWebViewLikely() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  const isAndroid = ua.includes('android')
  const hasWv = ua.includes(' wv') || ua.includes('version/') && !ua.includes('chrome/')
  return isAndroid && hasWv
}

// Collect runtime metrics from the current browser environment
function getRuntime() {
  if (typeof window === 'undefined') {
    return {
      innerWidth: 0,
      innerHeight: 0,
      visualWidth: 0,
      visualHeight: 0,
      visualScale: 1,
      dpr: 1,
      orientation: 'portrait',
      orientationType: 'unknown',
      maxTouchPoints: 0,
      pointerCoarse: false,
      pointerFine: false,
      hover: false,
      colorGamut: 'unknown',
      dynamicRange: 'unknown',
      safeArea: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      deviceMemory: null,
      connection: 'unknown',
      userAgent: 'unknown'
    }
  }

  const vv = window.visualViewport
  const innerWidth = window.innerWidth || 0
  const innerHeight = window.innerHeight || 0
  const visualWidth = vv?.width ?? innerWidth
  const visualHeight = vv?.height ?? innerHeight
  const visualScale = vv?.scale ?? 1
  const dpr = window.devicePixelRatio || 1
  const orientationType = window.screen?.orientation?.type || 'unknown'
  const orientation = visualWidth >= visualHeight ? 'landscape' : 'portrait'
  const maxTouchPoints = navigator.maxTouchPoints || 0
  const pointerCoarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
  const pointerFine = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches
  const hover = typeof matchMedia !== 'undefined' && matchMedia('(hover: hover)').matches
  const colorGamut = (() => {
    if (typeof matchMedia === 'undefined') return 'unknown'
    if (matchMedia('(color-gamut: rec2020)').matches) return 'rec2020'
    if (matchMedia('(color-gamut: p3)').matches) return 'p3'
    if (matchMedia('(color-gamut: srgb)').matches) return 'srgb'
    return 'unknown'
  })()
  const dynamicRange = (() => {
    if (typeof matchMedia === 'undefined') return 'unknown'
    if (matchMedia('(dynamic-range: high)').matches) return 'high'
    if (matchMedia('(dynamic-range: standard)').matches) return 'standard'
    return 'unknown'
  })()
  const style = typeof getComputedStyle !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const safeArea = {
    top: style?.getPropertyValue('env(safe-area-inset-top)')?.trim() || '0px',
    right: style?.getPropertyValue('env(safe-area-inset-right)')?.trim() || '0px',
    bottom: style?.getPropertyValue('env(safe-area-inset-bottom)')?.trim() || '0px',
    left: style?.getPropertyValue('env(safe-area-inset-left)')?.trim() || '0px'
  }
  const deviceMemory = navigator.deviceMemory ?? null
  const connection = (() => {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (!c) return 'unknown'
    return `saveData:${c.saveData || false} / ${c.downlink ?? '?'}Mbps / ${c.rtt ?? '?'}ms`
  })()
  const userAgent = navigator.userAgent || 'unknown'

  return {
    innerWidth,
    innerHeight,
    visualWidth: Math.round(visualWidth),
    visualHeight: Math.round(visualHeight),
    visualScale: Number(visualScale.toFixed(2)),
    dpr: Number(dpr.toFixed(2)),
    orientation,
    orientationType,
    maxTouchPoints,
    pointerCoarse,
    pointerFine,
    hover,
    colorGamut,
    dynamicRange,
    safeArea,
    deviceMemory,
    connection,
    userAgent
  }
}

// Approximate CSS viewport from declared device pixels and current DPR.
// Browsers may mask hardware pixels; this is only a starting point and editable by the user.
function estimateCssViewport(devicePx, dpr) {
  const safeDpr = dpr && Number.isFinite(dpr) && dpr > 0 ? dpr : 1
  const min = 320
  const max = 1400
  const w = Math.round(devicePx.w / safeDpr)
  const h = Math.round(devicePx.h / safeDpr)
  return {
    w: Math.min(Math.max(w, min), max),
    h: Math.min(Math.max(h, min), max)
  }
}

const props = defineProps({
  enabled: { type: Boolean, default: true }
})

const declaredPx = { w: 1272, h: 2800 }
const runtimeSnapshot = getRuntime()
const suggestedCss = estimateCssViewport(declaredPx, runtimeSnapshot.dpr)

const presets = [
  { name: 'Portrait 364×800', width: 364, height: 800 },
  { name: 'Landscape 800×364', width: 800, height: 364 },
  { name: 'Pixel 7a 412×915', width: 412, height: 915 },
  { name: 'Small 360×780', width: 360, height: 780 },
  { name: 'OnePlus Portrait (suggested)', width: suggestedCss.w, height: suggestedCss.h }
]

const selectedPreset = ref(presets[0].name)
const width = ref(presets[0].width)
const height = ref(presets[0].height)
const orientation = ref('portrait')
const dpr = ref(readEnv().dpr)
const scaleMode = ref('fit')
const manualScale = ref(1)
const fitScale = ref(1)
const frameRef = ref(null)
const metrics = ref(runtimeSnapshot)
const isGated = ref(isWebViewLikely())

const resolvedWidth = computed(() => (orientation.value === 'portrait' ? width.value : height.value))
const resolvedHeight = computed(() => (orientation.value === 'portrait' ? height.value : width.value))
const displayScale = computed(() => (scaleMode.value === 'fit' ? fitScale.value : manualScale.value))
const orientationLabel = computed(() => (orientation.value === 'portrait' ? 'portrait' : 'landscape'))

const viewportStyle = computed(() => {
  const base = {
    width: `${resolvedWidth.value}px`,
    height: `${resolvedHeight.value}px`,
    transformOrigin: '0 0'
  }

  if (!props.enabled) return base

  return {
    ...base,
    transform: `scale(${displayScale.value})`,
    '--debug-dpr': `${dpr.value}`
  }
})

function applyPreset() {
  const preset = presets.find(preset => preset.name === selectedPreset.value)
  if (!preset) return
  width.value = preset.width
  height.value = preset.height
}

function toggleOrientation() {
  orientation.value = orientation.value === 'portrait' ? 'landscape' : 'portrait'
}

function resetToEnv() {
  const next = readEnv()
  width.value = next.innerWidth
  height.value = next.innerHeight
  dpr.value = next.dpr
  orientation.value = next.orientation
}

function refreshMetrics() {
  metrics.value = getRuntime()
}

function syncDesign() {
  if (!props.enabled || isGated.value) return // Avoid pushing design vars when gated (WebView)
  applyDesignViewport({
    width: resolvedWidth.value,
    height: resolvedHeight.value,
    dpr: dpr.value
  })
}

function recomputeScale() {
  if (!props.enabled) return
  if (scaleMode.value !== 'fit') return
  const frame = frameRef.value
  if (!frame) return

  const availableWidth = frame.clientWidth || resolvedWidth.value
  const availableHeight = frame.clientHeight || resolvedHeight.value
  const nextScale = Math.min(availableWidth / resolvedWidth.value, availableHeight / resolvedHeight.value, 1)
  fitScale.value = Number.isFinite(nextScale) ? nextScale : 1
}

function handleResize() {
  refreshMetrics()
  recomputeScale()
}

watch([resolvedWidth, resolvedHeight, dpr], () => {
  syncDesign()
  recomputeScale()
})

watch(() => scaleMode.value, () => {
  recomputeScale()
})

watch(
  () => props.enabled,
  enabled => {
    if (enabled) {
      syncDesign()
      recomputeScale()
    }
  }
)

let resizeObserver

onMounted(() => {
  if (!isGated.value) syncDesign()
  recomputeScale()
  refreshMetrics()

  // Re-evaluate gate after mount in case UA changes
  isGated.value = isWebViewLikely()

  window.addEventListener('resize', handleResize)
  const vv = window.visualViewport
  vv?.addEventListener('resize', refreshMetrics)
  vv?.addEventListener('scroll', refreshMetrics)

  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => recomputeScale())
    if (frameRef.value) resizeObserver.observe(frameRef.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  const vv = window.visualViewport
  vv?.removeEventListener('resize', refreshMetrics)
  vv?.removeEventListener('scroll', refreshMetrics)

  if (resizeObserver && frameRef.value) resizeObserver.unobserve(frameRef.value)
})
</script>

<style scoped>
.debug-screen {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.08), transparent),
    radial-gradient(circle at 80% 0%, rgba(0, 255, 255, 0.06), transparent),
    #0f172a;
  color: #e2e8f0;
  min-height: 100vh;
}

.banner {
  padding: 10px 12px;
  border-radius: 10px;
  background: #2b1b1b;
  color: #f3d9d0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 13px;
}

.debug-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
}

.toolbar-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  align-items: start;
}

.toolbar-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 13px;
  color: #cbd5e1;
}

.control {
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
  padding: 0 10px;
  font-size: 13px;
}

.input {
  width: 96px;
}

button.control {
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease;
}

button.control:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.14);
}

.metrics {
  gap: 16px;
  font-size: 12px;
  color: #cbd5e1;
}

.info-panel {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-panel--p3 {
  box-shadow: 0 0 0 1px rgba(120, 220, 255, 0.35);
}

.info-panel--hdr {
  box-shadow: 0 0 0 1px rgba(255, 214, 102, 0.35);
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: #cbd5e1;
}

.info-row strong {
  font-weight: 600;
  color: #e2e8f0;
  text-align: right;
}

.ua {
  max-width: 240px;
  word-break: break-all;
}

.debug-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.debug-frame {
  width: 100%;
  max-width: 1200px;
  min-height: 400px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
  overflow: auto;
}

.debug-viewport {
  position: relative;
  background: #0b0f1a;
  border-radius: 18px;
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}

.badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 6px 10px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  font-size: 12px;
  color: #e2e8f0;
  backdrop-filter: blur(6px);
  pointer-events: none;
  z-index: 2;
}

.debug-screen--disabled .debug-frame {
  padding: 0;
  border: none;
  background: transparent;
}

.debug-screen--gated .control {
  opacity: 0.6;
}

@media (max-width: 960px) {
  .toolbar-grid {
    grid-template-columns: 1fr;
  }
}
</style>
