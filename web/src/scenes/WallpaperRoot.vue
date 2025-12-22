<template>
  <div class="phone" ref="phone" :style="{ backgroundColor: phoneColor }">
    <TouchArea :onPress="onPhonePress" :onRelease="onPhoneRelease" class="test-button" ref="test"
      :style="{ backgroundColor: buttonColor }">
      <div class="center-test">
        <div class="center-center"></div>
      </div>
    </TouchArea>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import TouchArea from '../components/TouchArea.vue'
import { inputEngine } from '../input/inputEngine'

const phoneColor = ref('black')
const phone = ref(null)

const buttonColor = ref('gray')
const test = ref(null)


// --- touch handlers for the button ---
function onPhonePress() {
  buttonColor.value = 'purple',
    phoneColor.value = 'purple'
}

function onPhoneRelease() {
  buttonColor.value = 'green',
    phoneColor.value = 'pink'
}

// --- register swipe on the whole phone ---
onMounted(() => {
  inputEngine.registerPressTarget(phone.value, {
    onSwipe: {
      left: () => phoneColor.value = 'red' ,
      right: () => phoneColor.value = 'green' ,
      up: () => phoneColor.value = 'orange' ,
      down: () => phoneColor.value = 'blue' 
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
  justify-content: flex-start;
  align-items: flex-start;
}

.test-button {
  width: 352px;
  height: 784px;
  border-radius: 35px;
  /* border-inline: 10px solid black; */
  user-select: none;
  cursor: pointer;
  touch-action: none;
  opacity: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.center-test {
  width: 70px;
  height: 70px;
  border-radius: 50px;
  border: 5px solid white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.center-center {
  width: 10px;
  height: 10px;
  background-color: red;
}
</style>
