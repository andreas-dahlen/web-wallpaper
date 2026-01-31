<template>
  <div class="scene-root b">
    <SwipeSlider
      class="swipe-slider"
      lane="slider1"
      axis="horizontal"
      :reactSwipeCommit="true"
    >
      <div class="slider-content">Slide Me!</div>
    </SwipeSlider>
  </div>
</template>

<script setup>
import SwipeSlider from '../../../components/SwipeSlider.vue'

defineOptions({ name: 'MidB' })

</script>

<style scoped>
.b {
  background: linear-gradient(135deg, #7aa2ff, #47c6ff);
}
.swipe-slider {
  height: 70px;
  width: 90%;
}

.slider-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 90%;
  width: 40%;
  color: white;
  font-weight: bold;
}

.slider-content {
  background: #4285f4;
  border-radius: 10px;
}
</style>