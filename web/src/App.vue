<!-- App.vue -->
<template>
  <div id="app">
    <DebugWrapper v-if="APP_SETTINGS.debugWrapper">
      <Root />
    </DebugWrapper>
    <Root v-else />
  </div>
</template>

<script setup>
import { APP_SETTINGS } from './config/appSettings'
import DebugWrapper from './components/DebugWrapper.vue'
import Root from './scenes/Root.vue'
</script>