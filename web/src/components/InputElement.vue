<template>
  <!--
    InputElement.vue
    ----------------
    This is a generic “gesture surface” element. It does not do app logic itself.
    It declares what gestures the engine should consider and optionally emits events to Vue.
  -->
  <div
    class="input-element"
    ref="el"

    :data-press="press ? true : null"
    :data-swipe="swipe ? true : null"
    :data-action="action || null"
    :data-direction="direction || null"

    :data-react-press="reactPress ? true : null"
    :data-react-press-release="reactPressRelease ? true : null"
    :data-react-press-cancel="reactPressCancel ? true : null"
    :data-react-swipe="reactSwipe ? true : null"
    :data-react-swipe-start="reactSwipeStart ? true : null"
    :data-react-swipe-commit="reactSwipeCommit ? true : null"
    :data-react-swipe-revert="reactSwipeRevert ? true : null"
    :data-react-swipe-release="reactSwipeRelease ? true : null"
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
// press / swipe / direction -> engine checks these
// reactPress / reactRelease / reactSwipe* / reactCancel -> controls Vue emission
const {
  action,
  press,
  swipe,
  direction,
  reactPress,
  reactPressRelease,
  reactPressCancel,
  reactSwipe,
  reactSwipeStart,
  reactSwipeCommit,
  reactSwipeRevert
// -------------------------------
// Event forwarding
// -------------------------------
} = defineProps({
  action: String,
  press: { type: Boolean, default: false },     // Can this element receive presses?
  swipe: { type: Boolean, default: false },     // Can this element receive swipes?
  direction: { type: String, default: undefined }, // Optional swipe direction constraint

  reactPress: { type: Boolean, default: false },          // Should a press emit a Vue event?
  reactPressRelease: { type: Boolean, default: false },   // Should a pressRelease emit a Vue event?
  reactPressCancel: { type: Boolean, default: false },    // Should a pressCancel emit a Vue event?
  reactSwipe: { type: Boolean, default: false },
  reactSwipeStart: { type: Boolean, default: false },
  reactSwipeCommit: { type: Boolean, default: false },
  reactSwipeRevert: { type: Boolean, default: false }
})

const emit = defineEmits([
  'press',
  'pressRelease',
  'pressCancel',
  'swipeStart',
  'swipe',
  'swipeCommit',
  'swipeRevert',
])

const el = ref(null)

function handleReaction(e) {
  const type = e.detail?.type
  if (!type) return
  // Emit the Vue event (onPress, onPressRelease, etc.)
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

/* Optional visual hooks
.input-element[data-press="true"][data-pressed="true"] {
  transform: scale(0.97);
}

.input-element[data-swipe="true"][data-swiping="true"] {
  opacity: 0.9;
} */
</style>
