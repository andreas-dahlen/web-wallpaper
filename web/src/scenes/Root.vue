<template>
  <div class="phone">
    <DebugPanel/>
    <div class="app-content">
      <LaneWallpaper/>
      <LanesHorizontal/>
      <TestButton/>
    </div>
  </div>
</template>

<script setup>
import DebugPanel from '../components/DebugPanel.vue'
import LaneWallpaper from './LaneWallpaper.vue'
import LanesHorizontal from './LanesHorizontal.vue'
import TestButton from '../buttons/TestButton.vue'
</script>

<style scoped>
.phone {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
}

.app-content {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-color: hotpink;
}

</style>
