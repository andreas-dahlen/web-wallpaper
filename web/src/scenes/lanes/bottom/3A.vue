<template>
  <div class="scene-root a">
    BOTTOM · A
    <ButtonZone></ButtonZone>
  </div>
</template>

<script setup>
  import ButtonZone from '../../../components/ButtonGrid.vue';
  defineOptions({ name: 'BottomA' })
</script>

<style scoped>
.a {
  background: linear-gradient(135deg, #ff7a7a, #ffb347);
}
</style>
