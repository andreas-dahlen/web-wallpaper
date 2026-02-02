<template>
  <div class="debug-shell">
    <div class="device-frame" :style="frameStyle">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { device, scale } from '../interaction/state/sizeState'

// Inline style for device frame using shared sizeState metrics
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
