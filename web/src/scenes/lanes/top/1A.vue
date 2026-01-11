<template>
  <div class="scene-root a">
    TOP · A
    <TestButton />
  </div>
</template>

<script setup>
import TestButton from '../../../buttons/TestButton.vue';
defineOptions({ name: 'TopA' })
</script>

<style scoped>
.a {
  background: linear-gradient(135deg, #ff7a7a, #ffb347);
}
</style>
