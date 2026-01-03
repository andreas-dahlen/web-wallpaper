<template>
  <div class="carousel" :style="carouselStyle">
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
   Movement math
-------------------------- */
const delta = computed(() => laneState.value.offset)
const transition = computed(() => `transform ${APP_SETTINGS.ui.swipeAnimationMs}ms ease`)
const translate = (v) => horizontal.value ? `translateX(${v}px)` : `translateY(${v}px)`

const currentStyle = computed(() => ({ position: 'absolute', inset: 0, transform: translate(delta.value), transition: transition.value }))
const prevStyle = computed(() => ({ position: 'absolute', inset: 0, transform: translate((horizontal.value ? -props.width : -props.height) + delta.value), transition: transition.value }))
const nextStyle = computed(() => ({ position: 'absolute', inset: 0, transform: translate((horizontal.value ? props.width : props.height) + delta.value), transition: transition.value }))

const carouselStyle = computed(() => ({ width: `${props.width}px`, height: `${props.height}px`, position: 'relative', overflow: 'hidden', touchAction: 'none' }))

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
.carousel { touch-action: none; }
.scene { user-select: none; will-change: transform; }
</style>
