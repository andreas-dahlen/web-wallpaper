<template>
  <!-- horizontal swipe lanes -->
  <!-- <div class="swipe-area-box lanes">
    <TouchArea
      v-for="lane in horizontalLanes"
      :key="lane.id"
      class="swipe-area"
      :id="lane.id"
      :data-lane="lane.lane"
      :data-direction="lane.dir"
      :onSwipe="lane.swipeDirs"
    />
  </div> -->

  <!-- vertical wallpaper lane -->
  <!-- <div class="swipe-area-box wallpaper">
    <TouchArea
      :data-lane="wallpaper.lane"
      :data-direction="wallpaper.dir"
      class="swipe-area-wallpaper"
      :onSwipe="wallpaper.swipeDirs"
    />
  </div> -->
</template>

<script setup>
import TouchArea from './TouchArea.vue'

/* ---------- lane config ---------- */

// const horizontalLanes = [
//   {
//     lane: 'top',
//     dir: 'horizontal',
//   },
//   {
//     lane: 'mid',
//     dir: 'horizontal',
//   },
//   {
//     lane: 'bottom',
//     dir: 'horizontal',
//   }
// ]

const wallpaper = {
  lane: 'wallpaper',
  dir: 'vertical',
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
