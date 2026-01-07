<!-- App.vue -->
<template>
  <div id="app">
    <DebugScreen :enabled="!isAndroid">
      <WallpaperRoot />
    </DebugScreen>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import WallpaperRoot from './scenes/WallpaperRoot.vue'
import DebugScreen from './components/DebugScreen.vue'

const isAndroid = computed(() => typeof Android !== 'undefined')
</script>