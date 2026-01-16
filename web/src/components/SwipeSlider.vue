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
import { computed, ref, onMounted, onBeforeUnmount, watchEffect } from 'vue'
import { ensureLane, setLaneSize } from '../state/swipeState'

defineOptions({ name: 'SwipeSlider'})

const props = defineProps({
  lane: { type: String, required: true },
  direction: { type: String, default: 'horizontal' },
  reactSwipeCommit: { type: Boolean, default: false },
})

const sliderEl = ref(null)
watchEffect(() => ensureLane(props.lane))
const horizontal = computed(() => props.direction === 'horizontal')
const dragging = ref(false)

function updateLaneSize() {
  if (!sliderEl.value) return
  const size = horizontal.value ? sliderEl.value.offsetWidth : sliderEl.value.offsetHeight
  setLaneSize(props.lane, size)
}

let observer
onMounted(() => {
  updateLaneSize()
  observer = new ResizeObserver(updateLaneSize)
  observer.observe(sliderEl.value)
  sliderEl.value?.addEventListener('reaction', handleReaction)
})
 
onBeforeUnmount(() => {
  observer?.disconnect()
  sliderEl.value?.removeEventListener('reaction', handleReaction)
})
 
const thumbStyle = computed(() => ({
  transform: horizontal.value
    ? `translate3d(${laneOffset.value}px,0,0)`
    : `translate3d(0,${laneOffset.value}px,0)`,
  transition: dragging.value ? 'none' : 'transform 150ms ease-out',
  willChange: 'transform',
}))

const laneState = computed(() => ensureLane(props.lane))
const laneOffset = computed(() => laneState.value.offset || 0)

function handleReaction(e) {
  const detail = e.detail || {}
  if (!detail.type) return

  if (detail.type === 'swipeStart') {
    dragging.value = true
    return
  }

  if (detail.type === 'swipeCommit') {
    dragging.value = false
    return
  }

  if (detail.type === 'swipeRevert') {
    dragging.value = false
    return
  }
}
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
  justify-content: center;
  align-items: center;
}
</style>
