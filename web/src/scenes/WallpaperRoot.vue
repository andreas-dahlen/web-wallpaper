<template>
  <div class="phone">
    <DebugPanel v-if="showDebugPanel" />
    <div class="app-content">
      <BKGimage />
      <ZoneLayout />
    </div>
  </div>
</template>

<script setup>
import DebugPanel from '../components/DebugPanel.vue'
import { APP_SETTINGS } from '../config/appSettings'
import BKGimage from './BKGimage.vue'
import ZoneLayout from './ZoneLayout.vue'
const showDebugPanel = APP_SETTINGS.debugPanel === true
</script>

<style scoped>
.phone {
  width: 100vw;
  height: 100vh;
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
