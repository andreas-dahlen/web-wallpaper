<!-- App.vue -->
<template>
  <div id="app">
    <WallpaperRoot />
  </div>
</template>

<script setup>
import WallpaperRoot from './scenes/WallpaperRoot.vue'
import { useScale } from './composables/useScale'

useScale()
</script>

<style>
#app {
  transform-origin: center center;
}
</style>