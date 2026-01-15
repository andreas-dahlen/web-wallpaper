<template>
  <div class="scene-root b">
    <SwipeDrag
      lane="bottom-drag"
      :react-swipe-commit="false"
    >
      <div class="drag-box">Drag me</div>
    </SwipeDrag>
  </div>
</template>

<script setup>
import SwipeDrag from '../../../components/SwipeDrag.vue'
defineOptions({ name: 'BottomB' })
</script>

<style scoped>
.b {
  background: linear-gradient(135deg, #7aa2ff, #47c6ff);
}

.drag-box {
  width: 180px;
  height: 180px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #0b1b2b;
  background: linear-gradient(135deg, #ffe28a, #ff9f68);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}
</style>
