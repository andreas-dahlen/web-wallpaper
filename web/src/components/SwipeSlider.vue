<template>
  <div
    ref="sliderEl"
    v-bind="$attrs"
    class="slider-container"
    :data-lane="lane"
    :data-axis="axis"
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
import { state } from '../interaction/state/stateManager'

const emit = defineEmits(['swipeCommit'])

defineOptions({ name: 'SwipeSlider' })

const props = defineProps({
  lane: { type: String, required: true },
  axis: { type: String, default: 'horizontal' },
  reactSwipeCommit: { type: Boolean, default: false },
})

/* -------------------------
   Refs / basics
-------------------------- */
const sliderEl = ref(null)
const horizontal = computed(() => props.axis === 'horizontal')

/* -------------------------
   Slider state refs
-------------------------- */
const laneState = computed(() => state.ensure('slider', props.lane))
const laneOffset = computed(() => laneState.value?.offset ?? 0)
const dragging = computed(() => laneState.value?.dragging ?? false)
const laneValue = computed(() => laneState.value?.value ?? 0)
const laneMin = computed(() => state.getMin('slider', props.lane) ?? 0)
const laneMax = computed(() => state.getMax('slider', props.lane) ?? 100)
const laneSize = computed(() => state.getSize('slider', props.lane) ?? 0)

/* -------------------------
   Watch / ensure slider exists
-------------------------- */
watchEffect(() => state.ensure('slider', props.lane))

/* -------------------------
   Resize / lane size
-------------------------- */
function updateLaneSize() {
  if (!sliderEl.value) return
  const size = horizontal.value ? sliderEl.value.offsetWidth : sliderEl.value.offsetHeight
  state.setSize('slider', props.lane, size)
}

let observer
onMounted(() => {
  updateLaneSize()
  observer = new ResizeObserver(updateLaneSize)
  observer.observe(sliderEl.value)

  sliderEl.value?.addEventListener('reaction', onReaction)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  sliderEl.value?.removeEventListener('reaction', onReaction)
})

/* -------------------------
   Reaction handling
-------------------------- */
function onReaction(e) {
  if (!props.reactSwipeCommit) return
  if (e.detail?.type !== 'swipeCommit') return
  emit('swipeCommit', e.detail)
}

/* -------------------------
   Computed thumb style
-------------------------- */
const thumbStyle = computed(() => {
  // Map value to position
  const posRatio = (laneValue.value - laneMin.value) / (laneMax.value - laneMin.value)
  const pos = posRatio * laneSize.value + laneOffset.value

  return {
    transform: horizontal.value
      ? `translate3d(${pos}px,0,0)`
      : `translate3d(0,${pos}px,0)`,
    transition: dragging.value ? 'none' : 'transform 150ms ease-out',
    willChange: 'transform'
  }
})
</script>

<style scoped>
.slider-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #eee;
  overflow: hidden;
  touch-action: none;
}

.slider-track {
  position: absolute;
  inset: 40% 5%;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
}

.slider-thumb {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: left;
  align-items: bottom;
}
</style>
