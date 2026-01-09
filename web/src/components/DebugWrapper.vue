<template>
  <div class="debug-wrapper">
    <slot />
  </div>
</template>

<script setup>
// Debug wrapper is purely structural; no scaling or sizing logic.
</script>

<style scoped>
.debug-wrapper {
  width: 100%;
  min-height: 100vh;
  display: block;
}
</style>
