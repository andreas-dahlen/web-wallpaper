<template>
  <div class="carousel" :style="carouselStyle">
    <!-- PREVIOUS SCENE -->
    <component
      v-if="total > 0"
      :is="prevScene"
      class="scene"
      :style="prevStyle"
    />

    <!-- CURRENT SCENE -->
    <component
      v-if="total > 0"
      :is="currentScene"
      class="scene"
      :style="currentStyle"
      @transitionend="onTransitionEnd"
    />

    <!-- NEXT SCENE -->
    <component
      v-if="total > 0"
      :is="nextScene"
      class="scene"
      :style="nextStyle"
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

// --- Lane state ---
const laneState = computed(() => swipeEngine.state.lanes[props.lane])
const isHorizontal = computed(() => props.direction === 'horizontal')

// --- Assign scenes to engine on mount ---
onMounted(() => {
  const safeScenes = props.scenes.map(c => markRaw(c))
  swipeEngine.setLaneScenes(props.lane, safeScenes)
})

// --- Indices ---
const total = computed(() => laneState.value.scenes?.length || 0)
const currentIndex = computed(() => laneState.value.currentIndex)

const prevIndex = computed(() =>
  total.value > 0 ? (currentIndex.value - 1 + total.value) % total.value : 0
)
const nextIndex = computed(() =>
  total.value > 0 ? (currentIndex.value + 1) % total.value : 0
)

// --- Scenes ---
const currentScene = computed(() => laneState.value.scenes[currentIndex.value] || null)
const prevScene = computed(() => laneState.value.scenes[prevIndex.value] || null)
const nextScene = computed(() => laneState.value.scenes[nextIndex.value] || null)

// --- Delta & transition ---
const delta = computed(() => {
  if (laneState.value.phase === 'settling') return laneState.value.targetDelta
  if (laneState.value.phase === 'dragging') return laneState.value.delta
  return 0
})

const transition = computed(() =>
  laneState.value.phase === 'dragging'
    ? 'none'
    : `transform ${APP_SETTINGS.ui.swipeAnimationMs}ms ease`
)

// --- Transform helpers ---
function translate(value) {
  return isHorizontal.value
    ? `translateX(${value}px)`
    : `translateY(${value}px)`
}

function offset(amount) {
  return translate(delta.value + amount)
}

// --- Styles ---
const baseSceneStyle = {
  position: 'absolute',
  inset: 0,
  willChange: 'transform',
  pointerEvents: 'none'
}

const currentStyle = computed(() => ({
  ...baseSceneStyle,
  transform: translate(delta.value),
  transition: transition.value
}))

const prevStyle = computed(() => ({
  ...baseSceneStyle,
  transform: offset(isHorizontal.value ? -props.width : -props.height),
  transition: transition.value
}))

const nextStyle = computed(() => ({
  ...baseSceneStyle,
  transform: offset(isHorizontal.value ? props.width : props.height),
  transition: transition.value
}))

const carouselStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  position: 'relative',
  overflow: 'hidden',
  touchAction: 'none'
}))

// --- Transition end ---
let transitionHandled = false
function onTransitionEnd(e) {
  if (e.propertyName !== 'transform') return
  const lane = laneState.value
  if (lane.phase !== 'settling') return

  lane.currentIndex = swipeEngine.getNextIndex(
    lane.currentIndex,
    props.lane,
    lane.outcome
  )

  // reset delta/phase after index update so next swipe works
  lane.delta = 0
  lane.targetDelta = 0
  lane.phase = 'idle'
  lane.outcome = null
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
