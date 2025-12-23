<template>
  <div ref="el" v-bind="$attrs">
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
  onSwipe: [Object, Function] // either {left,right,...} OR single function
})

const el = ref(null)
let registered = false

onMounted(() => {
  if (!el.value) return

  let swipeHandlers

  if (props.onSwipe) {
    if (typeof props.onSwipe === 'function') {
      swipeHandlers = {
        left: () => props.onSwipe('left'),
        right: () => props.onSwipe('right'),
        up: () => props.onSwipe('up'),
        down: () => props.onSwipe('down')
      }
    } else {
      // props.onSwipe is already an object { left: fn, right: fn, ... }
      swipeHandlers = props.onSwipe
    }
  }

  inputEngine.registerPressTarget(el.value, {
    onPress: props.onPress,
    onRelease: props.onRelease,
    onSwipe: swipeHandlers
  })

  registered = true
})

onUnmounted(() => {
  if (!registered || !el.value) return
  // Optional cleanup if inputEngine supports deregister
  // inputEngine.deregisterPressTarget(el.value)
})
</script>

<style scoped>
div {
  user-select: none;
  touch-action: none;
  cursor: pointer;
}
</style>
