<template>
  <!--
    InputElement.vue
    ----------------
    Generic gesture surface. Declares gestures for engine and optionally emits Vue events.
  -->
  <div
    class="input-element"
    ref="el"

    :data-press="press ? true : null"
    :data-swipe="swipe ? true : null"
    :data-action="action || null"
    :data-direction="direction || null"
    :data-swipe-type="swipeType || null"

    :data-react-press="reactPress ? true : null"
    :data-react-press-release="reactPressRelease ? true : null"
    :data-react-press-cancel="reactPressCancel ? true : null"
    :data-react-swipe="reactSwipe ? true : null"
    :data-react-swipe-start="reactSwipeStart ? true : null"
    :data-react-swipe-commit="reactSwipeCommit ? true : null"
    :data-react-swipe-revert="reactSwipeRevert ? true : null"
    :data-react-selected="reactSelected ? true : null"
    :data-react-deselected="reactDeselected ? true : null"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineOptions({ name: 'InputElement' })

// -------------------------------
// Props: configure engine eligibility
// -------------------------------
const {
  action,
  press,
  swipe,
  direction,
  swipeType,
  reactPress,
  reactPressRelease,
  reactPressCancel,
  reactSwipe,
  reactSwipeStart,
  reactSwipeCommit,
  reactSwipeRevert,
  reactSelected,
  reactDeselected
} = defineProps({
  action: String,
  press: { type: Boolean, default: false },
  swipe: { type: Boolean, default: false },
  direction: { type: String, default: undefined },
  swipeType: { type: String, default: undefined },

  reactPress: { type: Boolean, default: false },
  reactPressRelease: { type: Boolean, default: false },
  reactPressCancel: { type: Boolean, default: false },
  reactSwipe: { type: Boolean, default: false },
  reactSwipeStart: { type: Boolean, default: false },
  reactSwipeCommit: { type: Boolean, default: false },
  reactSwipeRevert: { type: Boolean, default: false },
  reactSelected: { type: Boolean, default: false },
  reactDeselected: { type: Boolean, default: false }
})

const emit = defineEmits([
  'press',
  'pressRelease',
  'pressCancel',
  'swipeStart',
  'swipe',
  'swipeCommit',
  'swipeRevert',
  'select',
  'deselect'
])

const el = ref(null)

// -------------------------------
// Handle reactions from engine
// -------------------------------
function handleReaction(e) {
  const type = e.detail?.type
  if (!type) return

  // Only emit Vue event if corresponding react* prop is true
  if (type === 'press' && !reactPress) return
  if (type === 'pressRelease' && !reactPressRelease) return
  if (type === 'pressCancel' && !reactPressCancel) return
  if (type === 'swipeStart' && !reactSwipeStart) return
  if (type === 'swipe' && !reactSwipe) return
  if (type === 'swipeCommit' && !reactSwipeCommit) return
  if (type === 'swipeRevert' && !reactSwipeRevert) return
  if (type === 'select' && !reactSelected) return
  if (type === 'deselect' && !reactDeselected) return

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
</style>
