<template>
  <div class="scene-root b">
    <SwipeDrag
      class="drag-container"
      lane="bottom-drag"
      direction="both"
      :reactSwipeCommit="true"
    >
      <div class="drag-content">Drag me</div>
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
.drag-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.drag-content {
  width: 130px;
  height: 130px;
  border-radius: 16px;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #0b1b2b;
  background: linear-gradient(135deg, #ffe28a, #ff9f68);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}
</style>
