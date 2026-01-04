<!-- scenes/WallpaperRoot.vue -->
<!--
  Wallpaper Root - Main container for the live wallpaper UI
  
  Layer Stack (bottom to top):
  1. BKGimage - Background wallpaper image
  2. ZoneLayout - Carousel lanes with scenes
  3. SwipeZones - Invisible touch detection areas (data-lane)
  
  The gesture system (gestureHandler.js) listens for pointer events
  and routes swipes to the correct carousel based on data-lane attributes.
-->
<template>
  <div class="phone">
    <div class="screen">
      <!-- Layer 1: Background -->
      <BKGimage />
      
      <!-- Layer 2: Carousel lanes -->
      <ZoneLayout />
      
      <!-- Layer 3: Invisible swipe detection zones -->
      <SwipeZones />
    </div>
  </div>
</template>

<script setup>
import BKGimage from './BKGimage.vue'
import ZoneLayout from './ZoneLayout.vue'
import SwipeZones from '../components/SwipeZones.vue'
</script>

<style scoped>
.phone {
  width: 364px;
  height: 800px;
  position: relative;
  overflow: hidden;
  
  /* GPU compositing for container */
  transform: translateZ(0);
}

.screen {
  width: 352px;
  height: 784px;
  position: absolute;
  left: 0;
  top: 0;
  
  /* Disable browser touch actions - handled by gesture system */
  touch-action: none;
  
  /* Prevent text selection during swipes */
  user-select: none;
  
  /* GPU compositing */
  transform: translateZ(0);
}
</style>
