<template>
  <div ref="el" class="touch-area" v-bind="$attrs">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { inputEngine } from '../input/inputEngine'

defineOptions({ name: 'TouchArea' })

const props = defineProps({
  onPress: Function,        // el, action
  onRelease: Function,      // el, action
  onPressCancel: Function,  // el, action
  onSwipeStart: Function,   // { el, axis }
  onSwipeRelease: Function, // { el, dir, total }
  onSwipe: Object,           // { left, right, up, down } each receives { el, dir, delta, total }
  action: Object
})

const el = ref(null)

onMounted(() => {
  // console.log('TouchArea mounted', el.value)
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
    onPress: () => props.onPress?.(el.value, props.action),
    onRelease: () => props.onRelease?.(el.value, props.action),
    onPressCancel: () => props.onPressCancel?.(el.value, props.action),
    onSwipe: handlers
  })
  console.log('TouchArea mounted', el.value, props.action, 'slide', props.slideId)
})

onBeforeUnmount(() => {
  if (!el.value) return
  inputEngine.unregisterPressTarget(el.value)
  console.log('TouchArea unmounted', el.value, props.action, 'slide', props.slideId)
})
</script>

<style scoped>
div {
  user-select: none;
  touch-action: none;
  cursor: pointer;
}
</style>
