<!-- scenes/ZoneLayout.vue -->
<!--
  Zone Layout - Contains all carousel lanes
  
  Layout Structure:
  - 3 horizontal lanes (top, mid, bottom) stacked vertically
  - Each lane is a SwipeCarousel with its own scenes
  
  The swipe detection zones are handled separately in SwipeZones.vue
  which overlays invisible touch areas with data-lane attributes.
-->
<template>
  <div class="layout">
    <SwipeCarousel
      lane="top"
      :scenes="topScenes"
      direction="horizontal"
    />

    <SwipeCarousel
      lane="mid"
      :scenes="midScenes"
      direction="horizontal"
    />

    <SwipeCarousel
      lane="bottom"
      :scenes="bottomScenes"
      direction="horizontal"
    />
  </div>
</template>

<script setup>
import SwipeCarousel from '../components/SwipeCarousel.vue'
import { LANES } from './lanes/laneIndex'

// Scene components for each lane
const topScenes = LANES.top
const midScenes = LANES.mid
const bottomScenes = LANES.bottom
</script>

<style scoped>
.layout {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 50%;
  /* Stack lanes vertically */
  display: flex;
  flex-direction: column;
  
  /* Layer above background, below swipe zones */
  z-index: 10;
  
  /* GPU compositing hint */
  transform: translateZ(0);
  
  /* Prevent any pointer events on container */
  pointer-events: none;
}

/* Allow pointer events on carousel children */
.layout :deep(.carousel) {
  pointer-events: auto;
}
</style>
