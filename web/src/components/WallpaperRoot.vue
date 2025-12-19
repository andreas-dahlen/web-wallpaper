<template>
  <div class="phone">
    <Button :onDown="onButtonDown" :onUp="onButtonUp">
      Click me!
    </Button>
    <div>
      Swipes change color
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useInput } from '../composables/useInput'
import Button from './Button.vue'

const phoneColor = ref('black')
const input = useInput()

function onButtonDown() {
  phoneColor.value = 'purple'
}

function onButtonUp() {
  phoneColor.value = 'black'
}

// Subscribe to swipe events
input.onSwipe('left', () => (phoneColor.value = 'red'))
input.onSwipe('right', () => (phoneColor.value = 'green'))
input.onSwipe('up', () => (phoneColor.value = 'orange'))
input.onSwipe('down', () => (phoneColor.value = 'blue'))
</script>

<style scoped>
.phone {
  width: 364px;
  height: 800px;
  border-radius: 40px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>

