<!-- App.vue -->
<template>
  <div id="app">
    <DebugWrapper v-if="APP_SETTINGS.platform === 'web' && APP_SETTINGS.DebugWrapper === true">
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