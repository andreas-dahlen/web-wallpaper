<template>
  <div
    class="carousel"
    :style="carouselStyle"
    :data-lane="lane"
    :data-direction="direction"
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
import { computed, watchEffect, markRaw } from 'vue'
import { ensureLane, setLaneCount, setLaneSize } from '../state/swipeState'
import { APP_SETTINGS } from '../config/appSettings'

const props = defineProps({
  lane: { type: String, required: true },
  scenes: { type: Array, required: true },
  direction: { type: String, default: 'horizontal' },
  width: { type: Number, required: true },
  height: { type: Number, required: true }
})

const horizontal = computed(() => props.direction === 'horizontal')
const laneState = computed(() => ensureLane(props.lane))

watchEffect(() => {
  setLaneCount(props.lane, props.scenes.length)
})

watchEffect(() => {
  const size = horizontal.value ? props.width : props.height
  setLaneSize(props.lane, size)
})

/* -------------------------
   Scene indexes
-------------------------- */
const totalScenes = computed(() => props.scenes.length)
const index = computed(() => laneState.value.index)

const prevIndex = computed(() =>
  totalScenes.value ? (index.value - 1 + totalScenes.value) % totalScenes.value : 0
)
const nextIndex = computed(() =>
  totalScenes.value ? (index.value + 1) % totalScenes.value : 0
)

const safeScenes = computed(() => props.scenes.map(s => markRaw(s)))
const currentScene = computed(() => safeScenes.value[index.value] || null)
const prevScene = computed(() => safeScenes.value[prevIndex.value] || null)
const nextScene = computed(() => safeScenes.value[nextIndex.value] || null)

/* -------------------------
   Movement math - OPTIMIZED
   
   Performance notes:
   - Use translate3d() to force GPU compositing layer
   - Disable transition during drag (dragging=true) for instant response
   - Only apply transition when animating to final position
-------------------------- */
const delta = computed(() => laneState.value.offset)
const isDragging = computed(() => laneState.value.dragging)

// CSS transition: none during drag, eased during animation
const transition = computed(() => {
  if (isDragging.value) return 'none'
  return `transform ${APP_SETTINGS.ui.swipeAnimationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
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
  transform: translate((horizontal.value ? -props.width : -props.height) + delta.value), 
  transition: transition.value 
}))

const nextStyle = computed(() => ({ 
  ...baseStyle, 
  transform: translate((horizontal.value ? props.width : props.height) + delta.value), 
  transition: transition.value 
}))

const carouselStyle = computed(() => ({ 
  width: `${props.width}px`, 
  height: `${props.height}px`, 
  position: 'relative', 
  overflow: 'hidden', 
  touchAction: 'none',
  // Force compositing layer for the container
  transform: 'translateZ(0)'
}))

/* -------------------------
   Commit after transition
-------------------------- */
function onTransitionEnd(e) {
  if (e.propertyName !== 'transform') return

  const lane = laneState.value
  if (!lane.pendingDir) return

  // 'right'/'down' offset shows PREVIOUS scene, so DECREMENT index
  if (lane.pendingDir === 'right' || lane.pendingDir === 'down') lane.index--
  // 'left'/'up' offset shows NEXT scene, so INCREMENT index
  if (lane.pendingDir === 'left' || lane.pendingDir === 'up') lane.index++

  // Wrap around
  lane.index = (lane.index + lane.count) % lane.count

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
