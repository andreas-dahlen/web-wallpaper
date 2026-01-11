<template>
  <div class="debug-shell">
    <div class="device-frame" :style="frameStyle">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { APP_SETTINGS } from '../config/appSettings'

// Props to optionally override virtual phone
const props = defineProps({
  device: { type: Object, default: null } // { width, height, density } in raw px
})

// ====== 1. Correct default device ======
// raw specs from internet
const defaultDeviceRaw = APP_SETTINGS.rawPhoneValues // density = logical density (like Android)

// Convert to CSS pixels (same as Kotlin does)
const defaultDevice = {
  width: defaultDeviceRaw.width / defaultDeviceRaw.density,
  height: defaultDeviceRaw.height / defaultDeviceRaw.density,
  density: defaultDeviceRaw.density
}

const device = computed(() => {
  if (!props.device) return defaultDevice
  return {
    width: props.device.width / props.device.density,
    height: props.device.height / props.device.density,
    density: props.device.density
  }
})

// ====== 2. Inject window.__DEVICE for inputViewport / thresholds ======
onMounted(() => {
  if (!window.__DEVICE) {
    window.__DEVICE = device.value
  }
})

// ====== 3. Scale device to fit viewport while preserving aspect ratio ======
const scale = computed(() => {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let scaleFactor = vh / device.value.height // height-first scaling
  if (device.value.width * scaleFactor > vw) {
    scaleFactor = vw / device.value.width // shrink to fit width
  }
  return scaleFactor
})

// ====== 4. Inline style for device frame ======
const frameStyle = computed(() => ({
  width: `${device.value.width}px`,
  height: `${device.value.height}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'center center',
}))
</script>

<style scoped>
.debug-shell {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b1220;
  overflow: hidden;
}

.device-frame {
  position: relative;
  border-radius: 22px;
  box-shadow:
    0 18px 48px rgba(0, 0, 0, 0.35),
    0 0 0 10px rgba(255, 255, 255, 0.05);
  background: #0f172a;
  overflow: hidden;
}
</style>
