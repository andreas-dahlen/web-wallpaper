<template>
  <div class="scene-root a">
    BOTTOM · A
    <ButtonGrid />
  </div>
</template>

<script setup>
import ButtonGrid from '../../../components/buttonGrid.vue'
defineOptions({ name: 'BottomA' })
</script>

<style scoped>
.a {
  background: linear-gradient(135deg, #ff7a7a, #ffb347);
}
</style>
