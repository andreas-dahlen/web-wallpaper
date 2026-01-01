<!-- scenes/BKGimage.vue -->
<template>
  <div class="layout">
    <SwipeCarousel
      lane="wallpaper"
      :scenes="scene"
      direction="vertical"
      :width="laneWidth"
      :height="laneHeight"
    />
  </div>
</template>


<script setup>
import SwipeCarousel from '../components/SwipeCarousel.vue'
import { APP_SETTINGS } from '../config/appSettings'
import { LANES } from './lanes/laneIndex'

// --- layout config ---
// const { laneWidth, laneHeight } = APP_SETTINGS.ui

const laneWidth = APP_SETTINGS.ui.laneWidth
const laneHeight = APP_SETTINGS.phone.height

const scene = LANES.wallpaper

</script>

<style scoped>
.layout {
  opacity: 100%;
  position: absolute;
  width: 100%;
  /* background-color: hotpink; */
}
</style>
