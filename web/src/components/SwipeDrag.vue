<template>
  <div
    ref="dragEl"
    class="drag-surface"
    :style="surfaceStyle"
  >
    <div
      ref="dragItem"
      class="drag-item"
      :style="itemStyle"
      :data-lane="lane"
      data-direction="both"
      data-swipe-type="drag"
      :data-react-swipe-commit="reactSwipeCommit ? true : null"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, markRaw, onMounted, onBeforeUnmount, watchEffect } from 'vue'
import { getLane, ensureLane, setLaneBounds, setDragPosition } from '../state/swipeState'

const dragEl = ref(null)
const dragItem = ref(null)

const emit = defineEmits(['swipeCommit'])

const props = defineProps({
  lane: { type: String, required: true },
  scenes: { type: Array, default: () => [] },
  reactSwipeCommit: { type: Boolean, default: false }
})

// const hasScenes = computed(() => props.scenes.length > 0)
// const safeScenes = computed(() => props.scenes.map(s => markRaw(s)))
// const currentScene = computed(() => safeScenes.value[0] || null)

watchEffect(() => ensureLane(props.lane))

const position = ref({ x: 0, y: 0 })
const dragging = ref(false)

const itemStyle = computed(() => ({
  transform: `translate3d(${position.value.x}px, ${position.value.y}px, 0)`,
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

onMounted(() => {
  updateBounds()
  boundsObserver = new ResizeObserver(updateBounds)
  if (dragEl.value) boundsObserver.observe(dragEl.value)
  dragItem.value?.addEventListener('reaction', handleReaction)
})

onBeforeUnmount(() => {
  boundsObserver?.disconnect()
  dragItem.value?.removeEventListener('reaction', handleReaction)
})

function handleReaction(e) {
  const detail = e.detail || {}
  if (!detail.type) return

  const lane = getLane(props.lane)

  switch(detail.type) {
    case 'swipeStart': {
      const base = lane?.dragPosition || { x: 0, y: 0 }
      position.value = { ...base }
      dragging.value = true
      break
    }

    case 'swipe': {
      const abs = detail.absolute || detail.delta || { x: 0, y: 0 }
      position.value = { x: abs.x, y: abs.y }
      break
    }

    case 'swipeCommit': {
      const final = detail.absolute || detail.delta || { x: 0, y: 0 }
      position.value = { x: final.x, y: final.y }
      setDragPosition(props.lane, position.value)
      dragging.value = false
      if (props.reactSwipeCommit) emit('swipeCommit', detail)
      break
    }

    case 'swipeRevert': {
      const base = lane?.dragPosition || { x: 0, y: 0 }
      position.value = { ...base }
      dragging.value = true
      // Let transition animate back; a follow-up commit/complete will clear dragging via renderer if needed
      break
    }
  }
}
let boundsObserver
function updateBounds() {
  if (!dragEl.value) return
  const rect = dragEl.value.getBoundingClientRect()
  setLaneBounds(props.lane, rect.width, rect.height)
}
</script>

<style scoped>

.drag-surface {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 👈 CRITICAL */
}

.drag-item {
  position: absolute;
  user-select: none;
  pointer-events: auto; /* 👈 only this receives input */
  contain: layout style paint;
}

</style>
