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
  onPress: Function,
  onRelease: Function,
  onPressCancel: Function,
  onSwipeRelease: Function,
  onSwipe: [Object, Function] // function(el, dir) OR { axis, left, right, ... }
})

const el = ref(null)

onMounted(() => {
  if (!el.value) return

  let handlers = {}
  if (props.onSwipe) {
    // ---------------------------------------------
    // FUNCTION form: onSwipe(el, dir)
    // ---------------------------------------------
    if (typeof props.onSwipe === 'function') {
      handlers = {
        left: () => props.onSwipe(el.value, 'left'),
        right: () => props.onSwipe(el.value, 'right'),
        up: () => props.onSwipe(el.value, 'up'),
        down: () => props.onSwipe(el.value, 'down')
      }
    }

    // ---------------------------------------------
    // OBJECT form: { onSwipe="{left:onLeft}" }
    // ---------------------------------------------
    else {
      handlers = {
        left: props.onSwipe.left && (() => props.onSwipe.left(el.value, 'left')),
        right: props.onSwipe.right && (() => props.onSwipe.right(el.value, 'right')),
        up: props.onSwipe.up && (() => props.onSwipe.up(el.value, 'up')),
        down: props.onSwipe.down && (() => props.onSwipe.down(el.value, 'down'))
      }
    }

    // Swipe end
    handlers.onSwipeEnd = () => {
      props.onSwipeRelease?.(el.value)
    }
  }

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
