<template>
  <div class="swipe-area-box">
    <TouchArea v-for="lane in lanes" 
      :key="lane.id"
      class="swipe-area"
      :id="lane.id"
      :onSwipeStart="onSwipeStart"
      :onSwipeRelease="onSwipeRelease"
      :onSwipe="lane.swipeDirs"
      :data-lane="lane.lane"
    />
  </div>
</template>

<script setup>
import TouchArea from './TouchArea.vue'
import { gestureBus } from '../input/bus/gestureBus'

const lanes = [
  { id: 'topLane', lane: 'top', swipeDirs: { left: onSwipeMove, right: onSwipeMove } },
  { id: 'midLane', lane: 'mid', swipeDirs: { left: onSwipeMove, right: onSwipeMove } },
  { id: 'bottomLane', lane: 'bottom', swipeDirs: { left: onSwipeMove, right: onSwipeMove } },
  { id: 'wallpaperLane', lane: 'wallpaper', swipeDirs: { up: onSwipeMove, down: onSwipeMove } }
]

function onSwipeStart(data) { gestureBus.emit('swipeStart', data) }
function onSwipeMove(data) { gestureBus.emit('swipeMove', data) }
function onSwipeRelease(data) { gestureBus.emit('swipeEnd', data) }
</script>

<style scoped>
.swipe-area-box { position: absolute; top: 0; left: 0; display: flex; flex-direction: column; }
.swipe-area { width: 352px; height: 265px; opacity: 0;}
.swipe-area-wallpaper { width: 352px; height: 784px; opacity: 0%; }
</style>
