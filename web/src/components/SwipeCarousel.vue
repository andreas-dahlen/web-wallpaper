<template>
  <div
    ref="carouselEl"
    class="carousel"
    :style="carouselStyle"
    :data-lane="lane"
    :data-direction="direction"
    :data-swipe-type="'carousel'"
    :data-react-swipe-commit="reactSwipeCommit ? true : null"
  >
    <component
      v-if="totalScenes > 0"
      :is="prevScene"
      class="scene"
      :style="prevStyle"
    />
    <component
      v-if="totalScenes > 0"
      :is="currentScene"
      class="scene"
      :style="currentStyle"
      @transitionend="onTransitionEnd"
    />
    <component
      v-if="totalScenes > 0"
      :is="nextScene"
      class="scene"
      :style="nextStyle"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watchEffect, markRaw } from 'vue'
import { ensureLane, setLaneCount, setLaneSize } from '../state/carouselState'
import { APP_SETTINGS } from '../config/appSettings'

const emit = defineEmits(['swipeCommit'])

const carouselEl = ref(null)
const laneSize = ref(0)

function updateLaneSize() {
  if (!carouselEl.value) return
  const size = horizontal.value ? carouselEl.value.offsetWidth : carouselEl.value.offsetHeight
  laneSize.value = size
  setLaneSize(props.lane, laneSize.value)
}

let observer
onMounted(() => {
  observer = new ResizeObserver(updateLaneSize)
  observer.observe(carouselEl.value)
  const el = carouselEl.value
  if (el) {
    el.addEventListener('reaction', (e) => {
      if (!props.reactSwipeCommit) return
      if (e.detail?.type !== 'swipeCommit') return
      emit('swipeCommit', e.detail)
    })
  }
})
onBeforeUnmount(() => {
  observer.disconnect()
})

const props = defineProps({
  lane: { type: String, required: true },
  scenes: { type: Array, required: true },
  direction: { type: String, default: 'horizontal' },
  reactSwipeCommit: { type: Boolean, default: false }
})

const horizontal = computed(() => props.direction === 'horizontal')
const laneState = computed(() => ensureLane(props.lane))

watchEffect(() => {
  setLaneCount(props.lane, props.scenes.length)
})

/* -------------------------
   Scene indexes
-------------------------- */
const totalScenes = computed(() => props.scenes.length)
const index = computed(() => laneState.value.index)

const safeScenes = computed(() => props.scenes.map(s => markRaw(s)))
const currentScene = computed(() => safeScenes.value[index.value] || null)

const prevScene = computed(() => {
  if (!totalScenes.value) return null
  const prevIdx = (index.value - 1 + totalScenes.value) % totalScenes.value
  return safeScenes.value[prevIdx] || null
})

const nextScene = computed(() => {
  if (!totalScenes.value) return null
  const nextIdx = (index.value + 1) % totalScenes.value
  return safeScenes.value[nextIdx] || null
})

/* -------------------------
   Movement math - OPTIMIZED
   
   Performance notes:
   - Use translate3d() to force GPU compositing layer
   - Disable transition during drag (dragging=true) for instant response
   - Only apply transition when animating to final position
-------------------------- */
const delta = computed(() => laneState.value.offset || 0)
const isDragging = computed(() => laneState.value.dragging)

// CSS transition: none during drag, eased during animation
const transition = computed(() => {
  if (isDragging.value) return 'none'
  return `transform ${APP_SETTINGS.swipeAnimationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
})

// Use translate3d for GPU acceleration
const translate = (v) => horizontal.value 
  ? `translate3d(${v}px, 0, 0)` 
  : `translate3d(0, ${v}px, 0)`

const baseStyle = { 
  position: 'absolute', 
  inset: 0, 
  backfaceVisibility: 'hidden',
  willChange: 'transform'
}

const currentStyle = computed(() => ({ 
  ...baseStyle, 
  transform: translate(delta.value), 
  transition: transition.value 
}))

const prevStyle = computed(() => ({ 
  ...baseStyle, 
  transform: translate(-laneSize.value + delta.value),
  transition: transition.value 
}))

const nextStyle = computed(() => ({ 
  ...baseStyle, 
  transform: translate(laneSize.value + delta.value),
  transition: transition.value 
}))

const carouselStyle = computed(() => ({ 
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  touchAction: 'none',
  transform: 'translateZ(0)'
}))

/* -------------------------
   Commit after transition
-------------------------- */
function onTransitionEnd(e) {
  if (e.propertyName !== 'transform') return

  const lane = laneState.value
  if (!lane.pendingDir) return

  // Commit index based on pendingDir
  switch (lane.pendingDir) {
    case 'right':
    case 'down':
      lane.index = (lane.index - 1 + lane.count) % lane.count
      break
    case 'left':
    case 'up':
      lane.index = (lane.index + 1) % lane.count
      break
  }

  lane.offset = 0
  lane.pendingDir = null
}
</script>

<style scoped>
.carousel { 
  touch-action: none;
  /* GPU compositing hints */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

.scene { 
  user-select: none;
  /* Prevent layout thrashing */
  contain: layout style paint;
}
</style>
