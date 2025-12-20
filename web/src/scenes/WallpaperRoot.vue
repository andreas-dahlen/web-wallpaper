<template>
  <div class="phone" ref="phone" :style="{ backgroundColor: phoneColor }">
    <TouchArea :onPress="onPhonePress" :onRelease="onPhoneRelease" class="test-button" ref="test" :style="{backgroundColor: buttonColor}">
      Click me!
    </TouchArea>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import TouchArea from '../components/TouchArea.vue'
import { inputEngine } from '../composables/inputEngine'

const phoneColor = ref('black')
const phone = ref(null)

const buttonColor = ref('black')
const test = ref(null)


// --- touch handlers for the button ---
function onPhonePress() { buttonColor.value = 'purple', phoneColor.value ='purple'}
function onPhoneRelease() { buttonColor.value = 'green', phoneColor.value = 'pink' }

// --- register swipe on the whole phone ---
onMounted(() => {
  inputEngine.registerPressTarget(phone.value, {
    onSwipe: {
      left: () => (phoneColor.value = 'red'),
      right: () => (phoneColor.value = 'green'),
      up: () => (phoneColor.value = 'orange'),
      down: () => (phoneColor.value = 'blue')
    }

  })
})
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
  /* background-color: white; */
  border: 10px solid hotpink;
  user-select: none;
  cursor: pointer;
  touch-action: none;
}
</style>
