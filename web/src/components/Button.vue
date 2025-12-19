<template>
  <div ref="el">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useButton } from '../composables/useButton'

// 1️⃣ Define props
const props = defineProps({
  onDown: Function,
  onUp: Function
})

const el = ref(null)

// 2️⃣ Pass them directly to the composable
useButton(el, { onDown: props.onDown, onUp: props.onUp })
</script>
