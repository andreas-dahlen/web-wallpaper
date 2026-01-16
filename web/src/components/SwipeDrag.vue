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
import { ref, computed, markRaw, onMounted, onBeforeUnmount } from 'vue'

const dragEl = ref(null)
const dragItem = ref(null)

const emit = defineEmits(['swipeCommit'])

const props = defineProps({
  lane: { type: String, required: true },
  scenes: { type: Array, default: () => [] },
  reactSwipeCommit: { type: Boolean, default: false }
})

const hasScenes = computed(() => props.scenes.length > 0)
const safeScenes = computed(() => props.scenes.map(s => markRaw(s)))
const currentScene = computed(() => safeScenes.value[0] || null)

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
  dragItem.value?.addEventListener('reaction', handleReaction)
})

function handleReaction(e) {
  const detail = e.detail || {}
  if (!detail.type) return

  if (detail.type === 'swipeStart') {
    dragging.value = true
    return
  }

  if (detail.type === 'swipe') {
    const abs = detail.absolute || detail.delta || { x: 0, y: 0 }
    position.value = { x: abs.x || 0, y: abs.y || 0 }
    console.log(position.value)
    return
  }

  if (detail.type === 'swipeCommit') {
    const abs = detail.absolute || detail.delta || { x: 0, y: 0 }
    position.value = { x: abs.x || 0, y: abs.y || 0 }
    dragging.value = false
    if (props.reactSwipeCommit) emit('swipeCommit', detail)
    return
  }

  if (detail.type === 'swipeRevert') {
    dragging.value = false
    return
  }
}

onBeforeUnmount(() => {
  dragItem.value?.removeEventListener('reaction', handleReaction)
})
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
