<template>
  <div class="lane" :style="laneStyle">

    <!-- Current scene -->
    <component
      v-if="currentIndex !== null"
      :is="scenes[currentIndex]"
      class="scene"
      :style="currentStyle"
    />

    <!-- Preview scene (incoming) -->
    <component
      v-if="previewIndex !== null"
      :is="scenes[previewIndex]"
      class="scene"
      :style="incomingStyle"
    />

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { swipeEngine } from '../input/swipeEngine'
import { swipeState } from '../scenes/state/SwipeState'

defineOptions({ name: 'SwipeCarousel' })

/* ------------------------------------------------------------------
   PROPS
------------------------------------------------------------------ */
const props = defineProps({
  lane: { type: String, required: true },
  scenes: { type: Array, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true }
})

/* ------------------------------------------------------------------
   STATE
------------------------------------------------------------------ */
const currentIndex = ref(swipeState[props.lane] ?? 0)

// Watch swipeState to update currentIndex when swipe completes
watch(
  () => swipeState[props.lane],
  i => {
    currentIndex.value = Number.isInteger(i) ? i : 0
  }
)

/* ------------------------------------------------------------------
   SWIPE STATE
------------------------------------------------------------------ */
const isActive = computed(() => swipeEngine.state.activeLane === props.lane)
const delta = computed(() => (isActive.value ? swipeEngine.state.delta : 0))
const dir = computed(() => (isActive.value ? swipeEngine.state.dir : null))

/* ------------------------------------------------------------------
   PREVIEW INDEX LOGIC (infinite loop)
------------------------------------------------------------------ */
const previewIndex = computed(() => {
  if (!dir.value) return null

  const len = props.scenes.length
  const i = currentIndex.value

  if (dir.value === 'left') return (i - 1 + len) % len
  if (dir.value === 'right') return (i + 1) % len
  return null
})

/* ------------------------------------------------------------------
   STYLES
------------------------------------------------------------------ */
const currentStyle = computed(() => ({
  transform: `translateX(${delta.value}px)`,
  transition: isActive.value ? 'none' : 'transform 300ms ease'
}))

const incomingStyle = computed(() => {
  if (!dir.value) return {}

  const offset =
    dir.value === 'left' ? props.width :
    dir.value === 'right' ? -props.width :
    0

  return {
    transform: `translateX(${delta.value + offset}px)`,
    transition: isActive.value ? 'none' : 'transform 300ms ease'
  }
})

const laneStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`
}))
</script>

<style scoped>
.lane {
  position: relative;
  overflow: hidden;
}

.scene {
  position: absolute;
  inset: 0;
  will-change: transform;
}
</style>
