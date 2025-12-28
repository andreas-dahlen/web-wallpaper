<template>
  <div class="carousel" :style="carouselStyle">
    <!-- Previous Scene -->
    <component
      v-if="totalScenes > 0"
      :is="prevScene"
      class="scene"
      :style="prevSceneStyle"
    />

    <!-- Current Scene -->
    <component
      v-if="totalScenes > 0"
      :is="currentScene"
      class="scene"
      :style="currentSceneStyle"
      @transitionend="handleTransitionEnd"
    />

    <!-- Next Scene -->
    <component
      v-if="totalScenes > 0"
      :is="nextScene"
      class="scene"
      :style="nextSceneStyle"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, markRaw } from 'vue'
import { swipeEngine } from '../input/swipeEngine'
import { APP_SETTINGS } from '../config/appSettings'

const props = defineProps({
  lane: { type: String, required: true },
  scenes: { type: Array, required: true },
  direction: { type: String, default: 'horizontal' },
  width: { type: Number, required: true },
  height: { type: Number, required: true }
})

console.log('SwipeCarousel mounted:', props.lane, props.scenes)
// --- Lane state & swipe direction ---
const lane = computed(() => swipeEngine.state.lanes[props.lane] ?? {
  scenes: [],
  currentIndex: 0,
  phase: 'idle',
  delta: 0,
  targetDelta: 0,
  outcome: null
})

const horizontal = computed(() => props.direction === 'horizontal')

// --- Assign scenes to engine on mount ---
onMounted(() => {
  const safeScenes = props.scenes.map(c => markRaw(c))
  swipeEngine.setLaneScenes(props.lane, safeScenes)
})

// --- Scene indices ---
const totalScenes = computed(() => lane.value.scenes?.length || 0)
const currentIndex = computed(() => lane.value.currentIndex)
const prevIndex = computed(() =>
  totalScenes.value > 0
    ? (currentIndex.value - 1 + totalScenes.value) % totalScenes.value
    : 0
)
const nextIndex = computed(() =>
  totalScenes.value > 0
    ? (currentIndex.value + 1) % totalScenes.value
    : 0
)

// --- Scene references ---
const currentScene = computed(() => lane.value.scenes[currentIndex.value] || null)
const prevScene = computed(() => lane.value.scenes[prevIndex.value] || null)
const nextScene = computed(() => lane.value.scenes[nextIndex.value] || null)

// --- Swipe delta & transition ---
const delta = computed(() => {
  if (lane.value.phase === 'dragging') return lane.value.delta * APP_SETTINGS.ui.swipeSpeedMultiplier
  if (lane.value.phase === 'settling') return lane.value.targetDelta
  return 0
})

const transition = computed(() =>
  lane.value.phase === 'dragging'
    ? 'none'
    : `transform ${APP_SETTINGS.ui.swipeAnimationMs}ms ease`
)

// --- Transform helpers ---
const translate = value =>
  horizontal.value ? `translateX(${value}px)` : `translateY(${value}px)`

// --- Scene styles ---
// Current slide follows the finger exactly
const currentSceneStyle = computed(() => ({
  position: 'absolute',
  inset: 0,
  willChange: 'transform',
  pointerEvents: 'none',
  transform: translate(delta.value),
  transition: transition.value
}))

// Previous slide sits left/top + delta
const prevSceneStyle = computed(() => ({
  position: 'absolute',
  inset: 0,
  willChange: 'transform',
  pointerEvents: 'none',
  transform: translate((horizontal.value ? -props.width : -props.height) + delta.value),
  transition: transition.value
}))

// Next slide sits right/bottom + delta
const nextSceneStyle = computed(() => ({
  position: 'absolute',
  inset: 0,
  willChange: 'transform',
  pointerEvents: 'none',
  transform: translate((horizontal.value ? props.width : props.height) + delta.value),
  transition: transition.value
}))

// --- Carousel container style ---
const carouselStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  position: 'relative',
  overflow: 'hidden',
  touchAction: 'none'
}))

/**
 * Called when swipe animation completes.
 * Updates the current index and resets the lane state.
 */
function handleTransitionEnd(e) {
  if (e.propertyName !== 'transform') return
  if (lane.value.phase !== 'settling') return

  lane.value.currentIndex = swipeEngine.getNextIndex(
    lane.value.currentIndex,
    props.lane,
    lane.value.outcome
  )

  // Reset delta/phase so next swipe works
  lane.value.delta = 0
  lane.value.targetDelta = 0
  lane.value.phase = 'idle'
  lane.value.outcome = null
}
</script>

<style scoped>
.carousel {
  touch-action: none;
}
.scene {
  user-select: none;
}
</style>
