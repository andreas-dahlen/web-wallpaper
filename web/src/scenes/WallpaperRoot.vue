<template>

  <div class="phone">

    <TouchArea class="screen" ref="screen" :onSwipe="{
      down: onSwipeDown,
      up: onSwipeUp
    }" :onSwipeRelease="swipeRelease">

      <SwipeZone/>

      <TouchArea class="test-button" :onPress="onPressBtn" :onRelease="onReleaseBtn"/>
      
    </TouchArea>
    
  </div>

</template>

<script setup>
  import TouchArea from '../components/TouchArea.vue'
import SwipeZone from '../components/SwipeZones.vue'
import { release, swipe, press } from '../animations/touchVisuals'

function onSwipeDown(el, dir) {
  console.log("inside wallpaperroot: DOWN")
  swipe(el, dir)
}

function onSwipeUp(el, dir) {
    console.log("inside wallpaperroot: UP")
  swipe(el, dir)
}

function swipeRelease(el) {
    console.log("inside wallpaperroot: RELEASE")
  release(el)
}

function onPressBtn (el) {
  console.log('WORKING ROOT PRESS')
  press(el)
}

function onReleaseBtn(el) {
  release(el)
    console.log('WORKING ROOT RELEASE')
}
</script>

<style scoped>
.phone {
  width: 364px;
  height: 800px;
  position: relative;
  overflow: hidden;
}

.screen {
  width: 352px;
  height: 784px;

  position: absolute;
  left: 0;
  top: 0;

  display: flex;
  justify-content: center;
  align-items: center;

  transition: background-color 0.3s ease;
}

.test-button {
  width: 100px;
  height: 100px;
  background-color: rgba(49, 50, 113, 0.743);
  border-radius: 100px;
  z-index: 10;
}
</style>
