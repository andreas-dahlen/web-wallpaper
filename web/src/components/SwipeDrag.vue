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
      data-axis="both"
      data-swipe-type="drag"
      :data-react-swipe-commit="reactSwipeCommit ? true : null"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { setDragPosition, getDragPosition } from '../interaction/state/dragState'

const dragEl = ref(null)
const dragItem = ref(null)
const emit = defineEmits(['swipeCommit'])

const props = defineProps({
  lane: { type: String, required: true },
  reactSwipeCommit: { type: Boolean, default: false }
})

const position = ref(getDragPosition(props.lane))
const dragging = ref(false)

const itemStyle = computed(() => ({
  transform: `translate3d(${position.value.x}px, ${position.value.y}px, 0)`,
  transition: dragging.value ? 'none' : 'transform 180ms ease-out',
  willChange: 'transform'
}))

let startPos = { x: 0, y: 0 } // local start of gesture

function handleReaction(e) {
  const detail = e.detail || {}
  if (!detail.type) return

  switch (detail.type) {
    case 'swipeStart':
      startPos = { ...getDragPosition(props.lane) } // remember where we start
      dragging.value = true
      break

    case 'swipe':
      const delta = detail.delta || { x: 0, y: 0 }
      const absolute = {
        x: startPos.x + (delta.x || 0),
        y: startPos.y + (delta.y || 0)
      }
      position.value = absolute
      setDragPosition(props.lane, absolute)
      break

    case 'swipeCommit':
      // just confirm final position
      const finalPos = position.value
      setDragPosition(props.lane, finalPos)
      dragging.value = false
      if (props.reactSwipeCommit) emit('swipeCommit', detail)
      break
  }
}

onMounted(() => {
  position.value = getDragPosition(props.lane)
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