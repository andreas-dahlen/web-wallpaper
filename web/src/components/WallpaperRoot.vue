<template>
  <div class="phone" ref="phone" :style="{ backgroundColor: phoneColor }">
    <Button  
    :onDown="onButtonDown" 
    :onUp="onButtonUp" 
    class="test-button" 
    >
      Click me!
    </Button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { input } from '../composables/inputEngine'
import Button from './Pressable.vue'

const phoneColor = ref('black')
const phone = ref(null)

function onButtonDown() { phoneColor.value = 'purple' }
function onButtonUp() { phoneColor.value = 'black' }

// --- register the whole phone div for global swipe detection ---
onMounted(() => {
  if (!phone.value) return
  input.registerElement(phone.value, {}) // we just want pointer events to reach it
})

// --- global swipe callbacks ---
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
.test-button {
  width: 200px;
  height: 200px;
  background-color: white;
  border: 10px solid hotpink;
}
</style>

