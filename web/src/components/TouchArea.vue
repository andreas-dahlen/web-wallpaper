<template>
  <div ref="el" class="touch-area" v-bind="$attrs">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gestureTargetRegistry } from '../input/core/gestureTargetRegistry'

const props = defineProps({
  onPress: Function,
  onRelease: Function,
  onPressCancel: Function,
  onSwipeStart: Function,
  onSwipeRelease: Function,
  onSwipe: Object,
  action: Object
})

const el = ref(null)

onMounted(() => {
  if (!el.value) return
  const swipeHandlers = {}
  const dirs = ['left','right','up','down']
  if (props.onSwipe) dirs.forEach(d => { if(props.onSwipe[d]) swipeHandlers[d]=props.onSwipe[d] })
  if (props.onSwipeStart) swipeHandlers.onSwipeStart = props.onSwipeStart
  if (props.onSwipeRelease) swipeHandlers.onSwipeRelease = props.onSwipeRelease

  gestureTargetRegistry.registerTarget(el.value, {
    onPress: () => props.onPress?.(el.value, props.action),
    onRelease: () => props.onRelease?.(el.value, props.action),
    onPressCancel: () => props.onPressCancel?.(el.value, props.action),
    onSwipe: swipeHandlers
  })
})

onBeforeUnmount(() => { if(el.value) gestureTargetRegistry.unregisterTarget(el.value) })
</script>

<style scoped>
div { user-select: none; touch-action: none; cursor: pointer; }
</style>
