<template>
  <div
    ref="dragEl"
    class="drag-surface"
    :style="surfaceStyle"
    :data-lane="lane"
    data-direction="both"
    data-swipe-type="drag"
    :data-react-swipe-commit="reactSwipeCommit ? true : null"
  >
    <component
      v-if="hasScenes"
      :is="currentScene"
      class="drag-item"
      :style="itemStyle"
    />
    <slot v-else />
  </div>
</template>

<script setup>
import { ref, computed, markRaw, onMounted, onBeforeUnmount, watchEffect } from 'vue'
import { ensureLane } from '../state/swipeState'

const dragEl = ref(null)

const emit = defineEmits(['swipeCommit'])

const props = defineProps({
  lane: { type: String, required: true },
  scenes: { type: Array, default: () => [] },
  reactSwipeCommit: { type: Boolean, default: false }
})

// Lane exists for gesture bookkeeping; we don't use size/index here but keep consistency with the engine
watchEffect(() => ensureLane(props.lane))

function updateBounds() {
  if (!dragEl.value) return
  const rect = dragEl.value.getBoundingClientRect()
  maxX.value = rect.width * 0.45
  maxY.value = rect.height * 0.45
}

const hasScenes = computed(() => props.scenes.length > 0)
const safeScenes = computed(() => props.scenes.map(s => markRaw(s)))
const currentScene = computed(() => safeScenes.value[0] || null)

// Drag math: base accumulates committed position; offset is live drag delta
const base = ref({ x: 0, y: 0 })
const offset = ref({ x: 0, y: 0 })
const dragging = ref(false)
const maxX = ref(0)
const maxY = ref(0)

function clamp(v, max) {
  if (!max && max !== 0) return v
  return Math.min(Math.max(v, -max), max)
}

const itemStyle = computed(() => ({
  transform: `translate3d(${base.value.x + offset.value.x}px, ${base.value.y + offset.value.y}px, 0)`,
  transition: dragging.value ? 'none' : 'transform 180ms ease-out',
  willChange: 'transform'
}))

const surfaceStyle = computed(() => ({
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  touchAction: 'none',
  transform: 'translateZ(0)'
}))

function handleReaction(e) {
  const detail = e.detail || {}
  if (!detail.type) return

  if (detail.type === 'swipeStart') {
    dragging.value = true
    offset.value = { x: 0, y: 0 }
    return
  }

  if (detail.type === 'swipe') {
    const delta = detail.delta || { x: 0, y: 0 }
    const targetX = base.value.x + (delta.x || 0)
    const targetY = base.value.y + (delta.y || 0)
    const clampedX = clamp(targetX, maxX.value)
    const clampedY = clamp(targetY, maxY.value)
    offset.value = { x: clampedX - base.value.x, y: clampedY - base.value.y }
    return
  }

  if (detail.type === 'swipeCommit') {
    const delta = detail.delta || { x: 0, y: 0 }
    const targetX = base.value.x + (delta.x || 0)
    const targetY = base.value.y + (delta.y || 0)
    base.value = {
      x: clamp(targetX, maxX.value),
      y: clamp(targetY, maxY.value)
    }
    offset.value = { x: 0, y: 0 }
    dragging.value = false
    if (props.reactSwipeCommit) emit('swipeCommit', detail)
    return
  }

  if (detail.type === 'swipeRevert') {
    offset.value = { x: 0, y: 0 }
    dragging.value = false
    return
  }
}

let observer
onMounted(() => {
  updateBounds()
  observer = new ResizeObserver(updateBounds)
  if (dragEl.value) observer.observe(dragEl.value)
  dragEl.value?.addEventListener('reaction', handleReaction)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  dragEl.value?.removeEventListener('reaction', handleReaction)
})
</script>

<style scoped>
.drag-surface {
  touch-action: none;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  position: relative;
}

.drag-item {
  position: absolute;
  inset: 0;
  user-select: none;
  contain: layout style paint;
}
</style>
