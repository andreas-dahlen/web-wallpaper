<!-- scenes/WallpaperRoot.vue -->
<template>
  <div class="phone">
    <div class="screen" ref="screen">
      <SwipeZone/>

      <BKGimage/>
      <ZoneLayout/>
    </div>
  </div>
</template>

<script setup>
import SwipeZone from '../components/SwipeZones.vue'
import BKGimage from './BKGimage.vue';
import ZoneLayout from './ZoneLayout.vue'
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
