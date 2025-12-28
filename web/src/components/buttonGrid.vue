<template>
    <div class="button-area-grid">
        <div v-for="item in buttons" :key="item">
        <TouchArea :key="item" :onPress="onPress(item)"
            :onRelease="onRelease(item)" :onPressCancel="onCancel(item)" />
        </div>
    </div>
</template>

<script setup>
import TouchArea from './TouchArea.vue'
import { APP_SETTINGS } from '../config/appSettings'

defineOptions({ name: 'ButtonZone' })

const buttons = [1, 2, 3]

function onPress(item) { console.log('pressed', item) }
function onRelease(item) { console.log('released', item) }
function onCancel(item) { console.log('cancel', item) }
</script>

<style scoped>
.button-area-grid {
    position: absolute;
    top: 0;
    left: 0;
    display: grid;
    grid-template-rows: 1fr 1fr 1fr;
    background-color: pink;
    width: 200px;
    height: 100px;
}

.button {
    width: 50px;
    height: 50px;
    background-color: blanchedalmond;
}
</style>