<template>
  <!-- horizontal swipe lanes -->
  <div class="swipe-area-box lanes">
    <TouchArea
      v-for="lane in horizontalLanes"
      :key="lane.id"
      class="swipe-area"
      :id="lane.id"
      :data-lane="lane.lane"
      :onSwipeStart="onSwipeStart"
      :onSwipeRelease="onSwipeRelease"
      :onSwipe="lane.swipeDirs"
    />
  </div>

  <!-- vertical wallpaper lane -->
  <div class="swipe-area-box wallpaper">
    <TouchArea
      :id="wallpaper.id"
      :data-lane="wallpaper.lane"
      class="swipe-area-wallpaper"
      :onSwipeStart="onSwipeStart"
      :onSwipeRelease="onSwipeRelease"
      :onSwipe="wallpaper.swipeDirs"
    />
  </div>
</template>

<script setup>
import TouchArea from './TouchArea.vue'
import { gestureBus } from '../input/bus/gestureBus'

/* ---------- lane config ---------- */

const horizontalLanes = [
  {
    id: 'topLane',
    lane: 'top',
    swipeDirs: { left: onSwipeMove, right: onSwipeMove }
  },
  {
    id: 'midLane',
    lane: 'mid',
    swipeDirs: { left: onSwipeMove, right: onSwipeMove }
  },
  {
    id: 'bottomLane',
    lane: 'bottom',
    swipeDirs: { left: onSwipeMove, right: onSwipeMove }
  }
]

const wallpaper = {
  id: 'wallpaperLane',
  lane: 'wallpaper',
  swipeDirs: { up: onSwipeMove, down: onSwipeMove }
}

/* ---------- gesture forwarding ---------- */

function onSwipeStart(data) {
  gestureBus.emit('swipeStart', data)
}

function onSwipeMove(data) {
  gestureBus.emit('swipeMove', data)
}

function onSwipeRelease(data) {
  gestureBus.emit('swipeEnd', data)
}
</script>

<style scoped>
.swipe-area-box {
  position: absolute;
  left: 0;
  top: 0;
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
