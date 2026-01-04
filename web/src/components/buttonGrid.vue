<template>
  <!--
    Button Grid - Example grid of interactive buttons
    
    Uses TouchArea for press/release feedback.
    Each button can trigger an action (e.g., open app via Android bridge).
  -->
  <div class="button-grid">
    <TouchArea 
      v-for="item in buttons"
      :key="item.id"
      class="button"
      :action="item"
      :onPressStart="onPressStart"
      :onPressEnd="onPressEnd"
      :onPressCancel="onPressCancel"
    >
      <span class="button-label">{{ item.label }}</span>
    </TouchArea>
  </div>
</template>

<script setup>
import TouchArea from './TouchArea.vue'

// Button configuration
const buttons = [
  { id: 1, label: '1', type: 'spotify', package: 'com.spotify.music' },
  { id: 2, label: '2', type: 'youtube', package: 'com.google.android.youtube' },
  { id: 3, label: '3', type: 'custom' },
  { id: 4, label: '4', type: 'custom' },
  { id: 5, label: '5', type: 'custom' },
  { id: 6, label: '6', type: 'custom' }
]

function onPressStart(el, action) {
  // Optional: Add custom press logic
}

function onPressEnd(el, action) {
  // Trigger app launch via Android bridge if available
  if (action?.package && typeof Android !== 'undefined') {
    Android.openApp(action.package)
  }
}

function onPressCancel(el, action) {
  // Press was cancelled (finger moved away)
}
</script>

<style scoped>
.button-grid {
  position: absolute;
  top: 20px;
  left: 20px;
  
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  
  width: 180px;
  padding: 10px;
  
  /* Visual styling */
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  
  /* Layer management */
  z-index: 30;
  
  /* GPU compositing */
  transform: translateZ(0);
}

.button {
  width: 50px;
  height: 50px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  
  /* Text styling */
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.button-label {
  pointer-events: none;
}
</style>
