<template>
  <!--
    Debug Panel - Shows current gesture state
    Only visible when DEBUG_ENABLED is true in gestureHandler.js
    
    Usage: Add <DebugPanel /> to WallpaperRoot.vue for development
  -->
  <div v-if="showDebug" class="debug-panel">
    <div class="debug-row">Phase: {{ gestureState.phase }}</div>
    <div class="debug-row">Axis: {{ gestureState.axis || '-' }}</div>
    <div class="debug-row">Lane: {{ gestureState.laneId || '-' }}</div>
    <div class="debug-row">Delta: {{ Math.round(gestureState.totalDelta) }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getGestureState } from '../input/gestureHandler'

const showDebug = ref(false)
const gestureState = ref({
  phase: 'IDLE',
  axis: null,
  laneId: null,
  totalDelta: 0
})

let intervalId = null

onMounted(() => {
  // Check if debug mode is available
  showDebug.value = typeof getGestureState === 'function'
  
  if (showDebug.value) {
    intervalId = setInterval(() => {
      gestureState.value = getGestureState()
    }, 32) // ~30fps update for debug display
  }
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 6px;
  
  font-family: monospace;
  font-size: 11px;
  color: #0f0;
  
  z-index: 9999;
  pointer-events: none;
}

.debug-row {
  white-space: nowrap;
}
</style>
