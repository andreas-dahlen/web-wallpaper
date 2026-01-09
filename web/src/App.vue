<!-- App.vue -->
<template>
  <div id="app">
    <DebugWrapper v-if="APP_SETTINGS.debugWrapper">
      <WallpaperRoot />
    </DebugWrapper>
    <WallpaperRoot v-else />
  </div>
</template>

<script setup>
import { APP_SETTINGS } from './config/appSettings'
import DebugWrapper from './components/DebugWrapper.vue'
import WallpaperRoot from './scenes/WallpaperRoot.vue'
</script>