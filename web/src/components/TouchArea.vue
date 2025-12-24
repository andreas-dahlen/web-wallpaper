<template>
  <div
    ref="el"
    class="touch-area"
    v-bind="$attrs"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { inputEngine } from '../input/inputEngine'

defineOptions({ name: 'TouchArea' })

const props = defineProps({
  onPress: Function,
  onRelease: Function,
  onPressCancel: Function,    // called when swipe cancels press
  onSwipe: [Object, Function] // {left,right,...} or single function
})

const el = ref(null)
let registered = false

onMounted(() => {
  if (!el.value) return

  let swipeHandlers
  if (props.onSwipe) {
    if (typeof props.onSwipe === 'function') {
      swipeHandlers = {
        left: () => props.onSwipe(el.value, 'left'),
        right: () => props.onSwipe(el.value, 'right'),
        up: () => props.onSwipe(el.value, 'up'),
        down: () => props.onSwipe(el.value, 'down')
      }
    } else {
      swipeHandlers = {
        left: () => props.onSwipe.left?.(el.value),
        right: () => props.onSwipe.right?.(el.value),
        up: () => props.onSwipe.up?.(el.value),
        down: () => props.onSwipe.down?.(el.value)
      }
    }
  }
  inputEngine.registerPressTarget(el.value, {
    onPress: () => props.onPress?.(el.value),
    onRelease: () => props.onRelease?.(el.value),
    onPressCancel: () => props.onPressCancel?.(el.value),
    onSwipe: swipeHandlers
  })

  registered = true
})

onUnmounted(() => {
  if (!registered || !el.value) return
  // Optional: deregister if needed
})
</script>

<style scoped>
div {
  user-select: none;
  touch-action: none;
  cursor: pointer;
}
</style>
