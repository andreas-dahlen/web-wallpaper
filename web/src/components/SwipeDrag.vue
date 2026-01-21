<template>
  <div
    ref="dragEl"
    class="drag-surface"
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const dragEl = ref(null)
const dragItem = ref(null)
const emit = defineEmits(['swipeCommit'])

const props = defineProps({
  lane: { type: String, required: true },
  reactSwipeCommit: { type: Boolean, default: false }
})

const position = ref({ x: 0, y: 0 })
const dragging = ref(false)

const itemStyle = computed(() => ({
  transform: `translate3d(${position.value.x}px, ${position.value.y}px, 0)`,
  transition: dragging.value ? 'none' : 'transform 180ms ease-out',
  willChange: 'transform'
}))

let startPos = { x: 0, y: 0 }

function handleReaction(e) {
  const detail = e.detail || {}
  if (!detail.type) return

  switch (detail.type) {
    case 'swipeStart':
      // Start from the absolute position provided by renderer or default 0
      startPos = detail.absolute || { x: 0, y: 0 }
      dragging.value = true
      break

    case 'swipe':
      // Use absolute if provided, otherwise fallback to delta
      const absolute = detail.absolute || {
        x: startPos.x + (detail.delta?.x || 0),
        y: startPos.y + (detail.delta?.y || 0)
      }
      position.value = absolute
      break

    case 'swipeCommit':
      dragging.value = false
      // Update final visual position
      position.value = detail.absolute || position.value
      if (props.reactSwipeCommit) emit('swipeCommit', detail)
      break
  }
}

onMounted(() => {
  dragItem.value?.addEventListener('reaction', handleReaction)
})
onBeforeUnmount(() => dragItem.value?.removeEventListener('reaction', handleReaction))
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