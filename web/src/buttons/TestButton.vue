<template>
    <div class="test-button">
        <InputElement 
            :data-state="interaction" 
            press 
            react-press 
            react-release 
            react-cancel 
            @press="onPress"
            @release="onRelease" 
            @cancel="onCancel">
            Fire Test Action
        </InputElement>
    </div>
</template>
<!-- @swipe-start="onSwipeStart"
@swipe="onSwipe"
@swipe-end="onSwipeEnd" -->

<script setup>
import { ref } from 'vue'
import InputElement from '../components/inputElement.vue'

const interaction = ref('idle')

function onPress() {
    interaction.value = 'pressed'
}
function onRelease() {
    interaction.value = 'released'
}
function onCancel() {
    interaction.value = 'cancel'
}
// const onSwipeStart = () => { swiping.value = true }
// const onSwipe = () => {}
// const onSwipeEnd = () => { swiping.value = false }
</script>

<style scoped>
.test-button {
    position: absolute;
    display: flex;
    justify-content: center;
    color: #f8fafc;
    width: 200px;
    height: 70px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.01em;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    touch-action: none;
    transition: background 120ms ease, transform 120ms ease;
}

.test-button :deep(.input-element) {
    display: inline-flex;
    align-items: center;
    background-color: black;
    border-radius: 10px;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.test-button :deep(.input-element[data-state='released']) {
    background-color: hotPink;
}

.test-button :deep(.input-element[data-state='pressed']) {
    background-color: chocolate;
}

.test-button :deep(.input-element[data-state='cancel']) {
    background-color: tomato;
}

/* .test-button[data-pressed="true"],
.test-button :deep(.input-element[data-pressed="true"]) {
    transform: translateY(2px);
    background: #0f172a;
} */
</style>