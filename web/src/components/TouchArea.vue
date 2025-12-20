<template>
  <div ref="el" v-bind="$attrs">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { inputEngine } from '../composables/inputEngine'

defineOptions({ name: 'TouchArea' })

// --- Props for the component ---
const props = defineProps({
  onPress: Function,
  onRelease: Function,
  onSwipe: Object // { left: fn, right: fn, up: fn, down: fn }
})

// --- DOM ref ---
const el = ref(null)

onMounted(() => {
  if (!el.value) return

  // Register element with inputEngine
  inputEngine.registerPressTarget(el.value, {
    onPress: props.onPress,
    onRelease: props.onRelease,
    onSwipe: props.onSwipe
  })
})
</script>

<style scoped>
/* optional: prevent text selection, etc. */
div {
  user-select: none;
  touch-action: none;
  cursor: pointer;
}
</style>
