<template>
  <!--
    TouchArea - Pressable element with visual feedback
    
    Used for: Buttons, icons, interactive elements (NOT swipe zones)
    
    The new gesture system (gestureHandler.js) handles swipes via data-lane.
    TouchArea is ONLY for discrete press/release interactions like buttons.
    
    For swipe zones, use a plain div with data-lane attribute instead.
  -->
  <div 
    ref="el" 
    class="touch-area" 
    v-bind="$attrs"
    @pointerdown="onPress"
    @pointerup="onRelease"
    @pointercancel="onCancel"
    @pointerleave="onCancel"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  /** Called when finger touches the element */
  onPressStart: Function,
  /** Called when finger lifts from the element */
  onPressEnd: Function,
  /** Called when press is cancelled (finger moved away) */
  onPressCancel: Function,
  /** Optional action data passed to callbacks */
  action: Object
})

const el = ref(null)
const isPressed = ref(false)

function onPress(e) {
  if (isPressed.value) return
  isPressed.value = true
  
  // Visual feedback
  el.value?.classList.add('pressed')
  
  // Callback
  props.onPressStart?.(el.value, props.action, e)
}

function onRelease(e) {
  if (!isPressed.value) return
  isPressed.value = false
  
  // Visual feedback
  el.value?.classList.remove('pressed')
  el.value?.classList.add('released')
  setTimeout(() => el.value?.classList.remove('released'), 150)
  
  // Callback
  props.onPressEnd?.(el.value, props.action, e)
}

function onCancel() {
  if (!isPressed.value) return
  isPressed.value = false
  
  // Reset visual state
  el.value?.classList.remove('pressed')
  
  // Callback
  props.onPressCancel?.(el.value, props.action)
}
</script>

<style scoped>
.touch-area {
  user-select: none;
  touch-action: none;
  cursor: pointer;
  
  /* GPU compositing for smooth transitions */
  transform: translateZ(0);
  will-change: transform, opacity;
  
  /* Default transition for visual feedback */
  transition: transform 0.1s ease, opacity 0.1s ease;
}

/* Press state - slight scale down for tactile feedback */
.touch-area.pressed {
  transform: translateZ(0) scale(0.95);
  opacity: 0.8;
}

/* Release flash effect */
.touch-area.released {
  transform: translateZ(0) scale(1.02);
}
</style>
