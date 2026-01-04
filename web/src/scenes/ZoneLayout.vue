<!-- scenes/ZoneLayout.vue -->
<template>
  <div class="layout">
    <SwipeCarousel
      lane="top"
      :scenes="topScenes"
      direction="horizontal"
      :width="laneWidth"
      :height="laneHeight"
    />

    <SwipeCarousel
      lane="mid"
      :scenes="midScenes"
      direction="horizontal"
      :width="laneWidth"
      :height="laneHeight"
    />

    <SwipeCarousel
      lane="bottom"
      :scenes="bottomScenes"
      direction="horizontal"
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
const laneHeight = APP_SETTINGS.ui.laneHeight

const topScenes = LANES.top
const midScenes = LANES.mid
const bottomScenes = LANES.bottom

</script>

<style scoped>
.layout {
  opacity: 50%;
  position: absolute;
  width: 100%;
  display: grid;
  grid-template-rows: repeat(3, auto);
  gap: 0px; /* or spacing if you want */
  justify-content: center;
  z-index: 20;
}
</style>
