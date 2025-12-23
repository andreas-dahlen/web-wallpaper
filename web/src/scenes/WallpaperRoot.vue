<template>

  <div class="phone">

    <div class="screen" ref="screen" :style="{ backgroundColor: screenColor }">

      <div class="swipe-area-box">

        <TouchArea class="swipe-area swipe-area-1" ref="swipeAreaOne" :style="{ backgroundColor: swipeColorOne }"
          :onPress = "onSwipeAreaOnePress" 
          :onRelease = "onSwipeAreaOneRelease"
          :onSwipe="{
            left: onSwipeAreaOneLeft,
            right: onSwipeAreaOneRight,
            up: onScreenUpSwipe,
            down: onScreenDownSwipe
          }">
        </TouchArea>

        <TouchArea class="swipe-area swipe-area-2" ref="swipeAreaTwo" :style="{ backgroundColor: swipeColorTwo }"
          :onPress = "onSwipeAreaTwoPress"
          :onRelease = "onSwipeAreaTwoRelease"
          :onSwipe="{
            left: onSwipeAreaTwoLeft,
            right: onSwipeAreaTwoRight,
            up: onScreenUpSwipe,
            down: onScreenDownSwipe
          }">
        </TouchArea>

        <TouchArea class="swipe-area swipe-area-3" ref="swipeAreaThree" :style="{ backgroundColor: swipeColorThree }"
          :onPress = "onSwipeAreaThreePress"
          :onRelease = "onSwipeAreaThreeRelease"
          :onSwipe="{
            left: onSwipeAreaThreeLeft,
            right: onSwipeAreaThreeRight,
            up: onScreenUpSwipe,
            down: onScreenDownSwipe
          }">
        </TouchArea>

      </div>

    </div>

  </div>

</template>

<script setup>
import { ref } from 'vue'
import TouchArea from '../components/TouchArea.vue'

const screenColor = ref('black')
const swipeColorOne = ref('transparent')
const swipeColorTwo = ref('transparent')
const swipeColorThree = ref('transparent')

// --- touch handlers for the screen ---
// function onScreenPress() {
//   screenColor.value = 'purple'
// }

// function onScreenRelease() {
//   screenColor.value = 'yellow'
// }

// const swipeHandlers = {
//   up: () => screenColor.value = 'yellow',
//   down: () => screenColor.value = 'black'
// }

// -- swipe areas for the swipe zones

function onScreenUpSwipe() {
  screenColor.value = 'blue'
}

function onScreenDownSwipe() {
  screenColor.value = 'orange'
}


//AREA 1
function onSwipeAreaOneLeft() {
  flashSwipeColor(swipeColorOne, 'red', 500)
}
function onSwipeAreaOneRight() {
  flashSwipeColor(swipeColorOne, 'green', 500)
}
function onSwipeAreaOnePress() {
  flashSwipeColor(swipeColorOne, 'pink', 1000)
}
function onSwipeAreaOneRelease() {
  flashSwipeColor(swipeColorOne, 'magenta', 500)
}

//AREA 2
function onSwipeAreaTwoLeft() {
  flashSwipeColor(swipeColorTwo, 'red', 500)
}
function onSwipeAreaTwoRight() {
  flashSwipeColor(swipeColorTwo, 'green', 500)
}
function onSwipeAreaTwoPress() {
  flashSwipeColor(swipeColorTwo, 'pink', 1000)
}
function onSwipeAreaTwoRelease() {
  flashSwipeColor(swipeColorTwo, 'magenta', 500)
}

//AREA 3
function onSwipeAreaThreeLeft() {
  flashSwipeColor(swipeColorThree, 'red', 500)
}
function onSwipeAreaThreeRight() {
  flashSwipeColor(swipeColorThree, 'green', 500)
}
function onSwipeAreaThreePress() {
  flashSwipeColor(swipeColorThree, 'pink', 1000)
}
function onSwipeAreaThreeRelease() {
  flashSwipeColor(swipeColorThree, 'magenta', 500)
}

function flashSwipeColor(areaRef, color, duration = 300) {
  areaRef.value = color
  setTimeout(() => {
    areaRef.value = 'transparent' // fade back
  }, duration)
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
}

.swipe-area-box {
  display: flex;
  flex-direction: column;
}

.swipe-area {
  width: 364px;
  height: 262px;
  transition: background-color 0.3s ease;
}

/* .swipe-area-1 {
  
}
.swipe-area-2 {

}
.swipe-area-3 {

} */
</style>
