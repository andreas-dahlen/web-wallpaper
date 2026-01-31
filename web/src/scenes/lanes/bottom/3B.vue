<template>
  <div class="scene-root b">
    <SwipeSlider
      class="swipe-slider"
      lane="slider2"
      axis="vertical"
      :reactSwipeCommit="true"
    >
      <div class="slider-content">Slide Me!</div>
    </SwipeSlider>
  </div>
</template>

<script setup>
import SwipeSlider from '../../../components/SwipeSlider.vue'

defineOptions({ name: 'bottomB' })

</script>

<style scoped>
.b {
  background: linear-gradient(135deg, #7aa2ff, #47c6ff);
}
.swipe-slider {
  height: 90%;
  width: 70px;
}

.slider-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40%;
  width: 90%;
  color: white;
  font-weight: bold;
}

.slider-content {
  background: #4285f4;
  border-radius: 10px;
}
</style>
