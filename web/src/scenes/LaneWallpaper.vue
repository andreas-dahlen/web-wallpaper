<!-- scenes/LaneWallpaper.vue -->
<!--
  Background Wallpaper Layer
  
  Contains the wallpaper carousel that responds to vertical swipes.
  This is the bottom-most visual layer in the stack.
-->
<template>
  <div class="wallpaper-layer">
    <SwipeCarousel
      lane="wallpaper"
      :scenes="scenes"
      axis="vertical"
    />
  </div>
</template>

<script setup>
import SwipeCarousel from '../components/SwipeCarousel.vue'
import { LANES } from './lanes/laneIndex'

// Wallpaper scenes from lane index
const scenes = LANES.wallpaper
</script>

<style scoped>
.wallpaper-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  
  opacity: 100;
  
  /* Lowest z-index - behind all other layers */
  z-index: 1;
  
  /* GPU compositing */
  transform: translateZ(0);
  
  /* No pointer events - swipes handled by SwipeZones */
  pointer-events: none;
}

/* Allow carousel to receive events */
.wallpaper-layer :deep(.carousel) {
  pointer-events: auto;
}
</style>
