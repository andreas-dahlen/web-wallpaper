<template>
    <div class="button-area-grid">
        <TouchArea 
            v-for="item in buttons"
            :key="item.id"
            class="button"
            :action="item"
            :onPress="onPress"
            :onRelease="onRelease" 
            :onPressCancel="onCancel" 
        />
    </div>
</template>

<script setup>
import TouchArea from './TouchArea.vue'
import { log } from '../debug/functions'

const buttons = [
  { id: 1, label: 'one', type: 'spotify' },
  { id: 2, label: 'two', type: 'youtube' },
  { id: 3, label: 'three', type: 'custom' },
  { id: 4, label: 'four', type: 'cus' },
  { id: 5, label: 'five', type: 'cust' },
  { id: 6, label: 'six', type: 'custo' }
]

function onPress(el, action) { log('uiButtons', action, el) }
function onRelease(el, action) { log('uiButtons', action, el) }
function onCancel(el, action) { log('uiButtons', action, el) }
</script>

<style scoped>
.button-area-grid {
    position: absolute;
    top: 0;
    left: 0;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    background-color: rgba(255, 192, 203, 0.424);
    width: 310px;
    height: 230px;
    gap: 10px;
    margin: 20px;
    justify-content: center;
    align-items: center;
    z-index: 20;
}

.button {
    width: 50px;
    height: 50px;
    background-color: rgb(0, 0, 0);
}
</style>
