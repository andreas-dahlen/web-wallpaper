<template>
  <!--
    Swipe Detection Zones
    
    These invisible overlay areas define where swipes can be detected.
    The gesture handler (gestureHandler.js) uses document.elementsFromPoint()
    to find elements with data-lane attributes at the touch point.
    
    Structure:
    - 3 horizontal lanes (top, mid, bottom) for left/right swipes
    - 1 wallpaper lane (full height) for up/down swipes
    
    The wallpaper zone is behind the horizontal zones so that:
    - Touching a horizontal lane area = horizontal swipe on that lane
    - Touching outside horizontal lanes = vertical swipe on wallpaper
  -->
  
  <!-- Horizontal swipe lanes (higher z-index, captures horizontal swipes) -->
  <div class="swipe-zones-horizontal">
    <div 
      v-for="lane in lanes" 
      :key="lane"
      :data-lane="lane"
      class="swipe-zone"
    />
  </div>

  <!-- Wallpaper lane (lower z-index, captures vertical swipes) -->
  <div 
    data-lane="wallpaper"
    class="swipe-zone-wallpaper"
  />
</template>

<script setup>
// Lane identifiers - must match SwipeCarousel lane props
const lanes = ['top', 'mid', 'bottom']
</script>

<style scoped>
/* Container for horizontal lanes */
.swipe-zones-horizontal {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10;
  
  display: flex;
  flex-direction: column;
  
  /* Container doesn't capture events */
  pointer-events: none;
}

/* Individual horizontal swipe zone */
.swipe-zone {
  width: 352px;
  height: 265px;
  
  /* Capture pointer events for gesture detection */
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  
  /* Invisible - uncomment for debugging */
  /* background: rgba(255, 0, 0, 0.15); */
  /* border: 1px solid rgba(255, 0, 0, 0.3); */
}

/* Wallpaper zone - full height, behind horizontal zones */
.swipe-zone-wallpaper {
  position: absolute;
  left: 0;
  top: 0;
  width: 352px;
  height: 784px;
  
  /* Behind horizontal lanes */
  z-index: 5;
  
  /* Capture pointer events for gesture detection */
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  
  /* Invisible - uncomment for debugging */
  /* background: rgba(0, 0, 255, 0.1); */
}
</style>
