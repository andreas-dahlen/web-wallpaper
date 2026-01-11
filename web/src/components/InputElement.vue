<template>
  <div
    class="input-element"
    ref="el"
    :data-press="press ? true : null"
    :data-swipe="swipe ? true : null"
    :data-action="action || null"
    :data-direction="direction || null"
    :data-react-press="reactPress ? true : null"
    :data-react-release="reactRelease ? true : null"
    :data-react-swipe="reactSwipe ? true : null"
    :data-react-swipe-start="reactSwipeStart ? true : null"
    :data-react-swipe-end="reactSwipeEnd ? true : null"
    :data-react-cancel="reactCancel ? true : null"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineOptions({ name: 'InputElement' })

/**
 * ReactionDescriptor schema:
 * - type: 'press' | 'release' | 'swipe-start' | 'swipe' | 'swipe-end' | 'cancel'
 * - element: HTMLElement
 * - laneId?: string
 * - actionId?: string
 * - axis?: 'horizontal' | 'vertical'
 * - direction?: 'left' | 'right' | 'up' | 'down'
 * - delta?: number
 */

// Declarative only: maps props to data-* for DomRegistry/reactionResolver
const { action, press, swipe, direction, reactPress, reactRelease, reactSwipe, reactSwipeStart, reactSwipeEnd, reactCancel } = defineProps({
  action: String,
  press: { type: Boolean, default: false },
  swipe: { type: Boolean, default: false },
  direction: { type: String, default: undefined },

  reactPress: { type: Boolean, default: false },
  reactRelease: { type: Boolean, default: false },
  reactSwipe: { type: Boolean, default: false },
  reactSwipeStart: { type: Boolean, default: false },
  reactSwipeEnd: { type: Boolean, default: false },
  reactCancel: { type: Boolean, default: false },
})

const emit = defineEmits([
  'press',
  'release',
  'swipe-start',
  'swipe',
  'swipe-end',
  'cancel'
])

const el = ref(null)

function handleReaction(e) {
  const type = e.detail?.type
  if (!type) return
  emit(type, e.detail)
}

onMounted(() => {
  el.value?.addEventListener('reaction', handleReaction)
})

onBeforeUnmount(() => {
  el.value?.removeEventListener('reaction', handleReaction)
})
</script>

<style scoped>
.input-element {
  user-select: none;
  touch-action: none;
}

/* Optional visual hooks */
.input-element[data-press="true"][data-pressed="true"] {
  transform: scale(0.97);
}

.input-element[data-swipe="true"][data-swiping="true"] {
  opacity: 0.9;
}
</style>
