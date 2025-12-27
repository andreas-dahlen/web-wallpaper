<template>
  <div ref="el" class="touch-area" v-bind="$attrs">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { inputEngine } from '../input/inputEngine'

defineOptions({ name: 'TouchArea' })

const props = defineProps({
  onPress: Function,        // el
  onRelease: Function,      // el
  onPressCancel: Function,  // el
  onSwipeStart: Function,   // { el, axis }
  onSwipeRelease: Function, // { el, dir, total }
  onSwipe: Object           // { left, right, up, down } each receives { el, dir, delta, total }
})

const el = ref(null)

onMounted(() => {
  if (!el.value) return

  // Wrap directional swipe handlers to always pass a single object
  const handlers = {}
  if (props.onSwipe) {
    for (const dir of ['left', 'right', 'up', 'down']) {
      if (props.onSwipe[dir]) {
        handlers[dir] = (data) => props.onSwipe[dir](data)
      }
    }
  }

  // Include swipe start and release hooks
  if (props.onSwipeStart) handlers.onSwipeStart = (data) => props.onSwipeStart(data)
  if (props.onSwipeRelease) handlers.onSwipeRelease = (data) => props.onSwipeRelease(data)

  inputEngine.registerPressTarget(el.value, {
    onPress: () => props.onPress?.(el.value),
    onRelease: () => props.onRelease?.(el.value),
    onPressCancel: () => props.onPressCancel?.(el.value),
    onSwipe: handlers
  })
})
</script>

<style scoped>
div {
  user-select: none;
  touch-action: none;
  cursor: pointer;
}
</style>
