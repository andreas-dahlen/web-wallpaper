<template>

  <div class="phone">

    <div class="screen" ref="screen" :style="{ backgroundColor: screenColor }">

      <SwipeZone @screen-swipe="onScreenSwipe"/>

    </div>

  </div>

</template>

<script setup>
import { ref } from 'vue'
import SwipeZone from '../components/SwipeZones.vue'

function onScreenSwipe(dir) {
  if (dir === 'up') screenColor.value = 'blue'
  if (dir === 'down') screenColor.value = 'yellow'
  // optional: reset or other logic
}
const screenColor = ref('white')

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

</style>
