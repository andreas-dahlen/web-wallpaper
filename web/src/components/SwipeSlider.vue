<template>
  <div
    ref="sliderEl"
    v-bind="$attrs"
    class="slider-container"
    :data-lane="lane"
    :data-direction="direction"
    data-swipe-type="slider"
    :data-react-swipe-commit="reactSwipeCommit ? true : null"
  >
    <div class="slider-track"></div>
    <div class="slider-thumb" :style="thumbStyle">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { getLane } from '../state/swipeState'

defineOptions({ name: 'SwipeSlider'})

const props = defineProps({
  lane: { type: String, required: true },
  direction: { type: String, default: 'horizontal' },
  reactSwipeCommit: { type: Boolean, default: false },
})

const sliderEl = ref(null)
const horizontal = computed(() => props.direction === 'horizontal')

const thumbStyle = computed(() => ({
  transform: horizontal.value
    ? `translate3d(${laneOffset.value}px,0,0)`
    : `translate3d(0,${laneOffset.value}px,0)`,
  transition: dragging.value ? 'none' : 'transform 150ms ease-out',
  willChange: dragging.value ? 'transform' : 'auto'
}))

const laneState = computed(() => getLane(props.lane))
const laneOffset = computed(() => laneState.value?.offset || 0)
const dragging = computed(() => laneState.value?.dragging || false)
</script>

<style scoped>
.slider-container {
  position: relative;
  width: 100%;
  height: 100%; /* track height */
  background: #eee;
  overflow: hidden;
  touch-action: none;
}

.slider-track {
  position: absolute;
  inset: 40% 5%;
  border-radius: 999px;
  background: rgba(0,0,0,0.08);
}

.slider-thumb {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}
</style>
