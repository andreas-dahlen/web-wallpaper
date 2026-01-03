<template>
  <!-- horizontal swipe lanes -->
  <div class="swipe-area-box lanes">
    <TouchArea
      v-for="lane in horizontalLanes"
      :key="lane.id"
      class="swipe-area"
      :id="lane.id"
      :data-lane="lane.lane"
      :onSwipe="lane.swipeDirs"
    />
  </div>

  <!-- vertical wallpaper lane -->
  <div class="swipe-area-box wallpaper">
    <TouchArea
      :id="wallpaper.id"
      :data-lane="wallpaper.lane"
      class="swipe-area-wallpaper"
      :onSwipe="wallpaper.swipeDirs"
    />
  </div>
</template>

<script setup>
import TouchArea from './TouchArea.vue'

/* ---------- lane config ---------- */

const horizontalLanes = [
  {
    id: 'topLane',
    lane: 'top',
    swipeDirs: { left: () => {}, right: () => {} }
  },
  {
    id: 'midLane',
    lane: 'mid',
    swipeDirs: { left: () => {}, right: () => {} }
  },
  {
    id: 'bottomLane',
    lane: 'bottom',
    swipeDirs: { left: () => {}, right: () => {} }
  }
]

const wallpaper = {
  id: 'wallpaperLane',
  lane: 'wallpaper',
  swipeDirs: { up: () => {}, down: () => {} }
}
</script>

<style scoped>
.swipe-area-box {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10; /* Above visual layers */
}

/* horizontal lanes */
.lanes {
  display: flex;
  flex-direction: column;
}

.swipe-area {
  width: 352px;
  height: 265px;
  opacity: 0;
}

/* wallpaper lane */
.wallpaper {
  top: 0;
}

.swipe-area-wallpaper {
  width: 352px;
  height: 784px;
  opacity: 0;
}
</style>
