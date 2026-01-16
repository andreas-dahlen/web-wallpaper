<template>
  <div
    ref="carouselEl"
    class="carousel"
    :style="carouselStyle"
    :data-lane="lane"
    :data-direction="direction"
    :data-swipe-type="'carousel'"
    :data-react-swipe-commit="reactSwipeCommit ? true : null"
    :data-lane-count="scenes.length"
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
import { ref, onMounted, onBeforeUnmount, computed, markRaw } from 'vue'
import { getLane, ensureLane } from '../state/swipeState'
import { APP_SETTINGS } from '../config/appSettings'

const emit = defineEmits(['swipeCommit'])

const props = defineProps({
  lane: { type: String, required: true },
  scenes: { type: Array, required: true },
  direction: { type: String, default: 'horizontal' },
  reactSwipeCommit: { type: Boolean, default: false }
})

const carouselEl = ref(null)
const laneState = computed(() => ensureLane(props.lane) || getLane(props.lane) || {})
const horizontal = computed(() => props.direction === 'horizontal')
const laneSize = computed(() => laneState.value?.size || 0)

/* -------------------------
   Scene indexes
-------------------------- */
const totalScenes = computed(() => props.scenes.length)
const index = computed(() => laneState.value?.index ?? 0)

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
const delta = computed(() => laneState.value?.offset || 0)
const isDragging = computed(() => laneState.value?.dragging ?? false)
const transition = computed(() =>
  isDragging.value
    ? 'none'
    : `transform ${APP_SETTINGS.swipeAnimationMs}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
)

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
   External swipeCommit emit
-------------------------- */
function handleReaction(e) {
  if (!props.reactSwipeCommit) return
  if (e.detail?.type !== 'swipeCommit') return
  emit('swipeCommit', e.detail)
}

onMounted(() => {
  carouselEl.value?.addEventListener('reaction', handleReaction)
})
onBeforeUnmount(() => {
  carouselEl.value?.removeEventListener('reaction', handleReaction)
})
</script>

<style scoped>
.carousel { 
  touch-action: none;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

.scene { 
  user-select: none;
  contain: layout style paint;
}
</style>
