<template>
  <div class="carousel" :style="carouselStyle" :data-lane="props.lane">
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
import { swipeState, ensureLane, setLaneCount } from '../state/swipeState'
import { APP_SETTINGS } from '../config/appSettings'

/* -------------------------
   Props
-------------------------- */
const props = defineProps({
  lane: { type: String, required: true },
  scenes: { type: Array, required: true },
  direction: { type: String, default: 'horizontal' },
  width: { type: Number, required: true },
  height: { type: Number, required: true }
})

const horizontal = computed(() => props.direction === 'horizontal')

/* -------------------------
   Bind to lane state
-------------------------- */
const laneState = computed(() => ensureLane(props.lane))

watchEffect(() => {
  setLaneCount(props.lane, props.scenes.length)
})

/* -------------------------
   Scenes & indexes
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
   Movement math
-------------------------- */
const delta = computed(() => laneState.value.offset)

const transition = computed(() =>
  `transform ${APP_SETTINGS.ui.swipeAnimationMs}ms ease`
)

const translate = (v) =>
  horizontal.value ? `translateX(${v}px)` : `translateY(${v}px)`

/* -------------------------
   Scene styles
-------------------------- */
const currentStyle = computed(() => ({
  position: 'absolute',
  inset: 0,
  transform: translate(delta.value),
  transition: transition.value
}))

const prevStyle = computed(() => ({
  position: 'absolute',
  inset: 0,
  transform: translate(
    (horizontal.value ? -props.width : -props.height) + delta.value
  ),
  transition: transition.value
}))

const nextStyle = computed(() => ({
  position: 'absolute',
  inset: 0,
  transform: translate(
    (horizontal.value ? props.width : props.height) + delta.value
  ),
  transition: transition.value
}))

/* -------------------------
   Carousel container style
-------------------------- */
const carouselStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  position: 'relative',
  overflow: 'hidden',
  touchAction: 'none'
}))
</script>

<style scoped>
.carousel {
  touch-action: none;
}
.scene {
  user-select: none;
  will-change: transform;
}
</style>
