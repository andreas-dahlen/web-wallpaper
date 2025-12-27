<template>

  <div class="phone">

    <TouchArea class="screen" ref="screen" :onSwipe="{
      down: onSwipeDown,
      up: onSwipeUp
    }"
    :onSwipeRelease="onSwipeRelease"
    >
      <SwipeZone/>

      <ZoneLayout/>
    </TouchArea>
    
  </div>

</template>

<script setup>
  import TouchArea from '../components/TouchArea.vue'
import SwipeZone from '../components/SwipeZones.vue'
import ZoneLayout from './ZoneLayout.vue'

function onSwipeDown(data) {
    // console.log('SCREEN swipe!, dir = ', data.dir, 'DELTA = ', data.delta, 'TOTAL = ', data.total)
    console.log('|')
  // swipe(el, dir)
}

function onSwipeUp(data) {

  // console.log('!SCREEN swipe!, dir = ', data.dir, ' DELTA = ', data.delta, 'TOTAL = ', data.total)
  // swipe(el, dir)
  console.log('|')
}

function onSwipeRelease(data) {
    // swipeEnd(el)
    // console.log('SCREEN swipe: swipe ended, dir = ', data.dir, 'total = ', data.total)
}


// function swipeRelease(el) {
//     console.log('SCREEN: swipe ended')
//   release(el)
// }

// function onPressBtn (el) {
//   console.log('BUTTON: press')
//   press(el)
// }

// function onReleaseBtn(el) {
//   release(el)
//     console.log('BUTTON: release')
// }

// function onCancel(el) {
//   cancel(el)
//   console.log('BUTTON: cancel')
// }
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
  border-radius: 100px;
  z-index: 10;
  transition: background-color 0.3s ease;
}
</style>
