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

const emit = defineEmits(['swipeCommit'])

const sliderEl = ref(null)
watchEffect(() => ensureLane(props.lane))
const horizontal = computed(() => props.direction === 'horizontal')

// Position state: base is committed position, offset is in-progress drag delta
const base = ref(0)
const offset = ref(0)
const dragging = ref(false)
const maxDistance = ref(0)

function clamp(v, max) {
  if (!max && max !== 0) return v
  return Math.min(Math.max(v, -max), max)
}

function updateLaneSize() {
  if (!sliderEl.value) return
  const size = horizontal.value ? sliderEl.value.offsetWidth : sliderEl.value.offsetHeight
  setLaneSize(props.lane, size)
  maxDistance.value = size * 0.45 // keep thumb within track bounds
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
    ? `translate3d(${base.value + offset.value}px,0,0)`
    : `translate3d(0,${base.value + offset.value}px,0)`,
  transition: dragging.value ? 'none' : 'transform 150ms ease-out',
  willChange: 'transform',
}))

function handleReaction(e) {
  const detail = e.detail || {}
  if (!detail.type) return

  if (detail.type === 'swipeStart') {
    dragging.value = true
    offset.value = 0
    return
  }

  if (detail.type === 'swipe') {
    const delta = typeof detail.delta === 'number' ? detail.delta : 0
    const target = base.value + delta
    const clamped = clamp(target, maxDistance.value)
    offset.value = clamped - base.value
    return
  }

  if (detail.type === 'swipeCommit') {
    const delta = typeof detail.delta === 'number' ? detail.delta : 0
    const target = base.value + delta
    base.value = clamp(target, maxDistance.value)
    offset.value = 0
    dragging.value = false
    if (props.reactSwipeCommit) emit('swipeCommit', detail)
    return
  }

  if (detail.type === 'swipeRevert') {
    // Slider should never revert; ignore
    dragging.value = false
    offset.value = 0
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
