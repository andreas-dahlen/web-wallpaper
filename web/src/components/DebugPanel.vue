<template>
  <div class="debug">
    {{ gesture }}
  </div>
</template>

<script setup>
import { ref } from 'vue'

const gesture = ref(null)
setInterval(() => {
  gesture.value = window.__lastGesture
}, 16)
</script>
