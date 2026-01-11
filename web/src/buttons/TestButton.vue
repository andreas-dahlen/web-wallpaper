<template>
    <div class="test-button">
        <InputElement 
            press 
            react-press 
            react-release 
            react-cancel
            @press="onPress" @release="onRelease" @cancel="onCancel">
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

const pressed = ref(false)

function onPress() { pressed.value = true }
function onRelease() { pressed.value = false }
function onCancel() { pressed.value = false }
// const onSwipeStart = () => { swiping.value = true }
// const onSwipe = () => {}
// const onSwipeEnd = () => { swiping.value = false }
</script>

<style scoped>
.test-button {
    position: absolute;
    display: flex;
    justify-content: center;
    padding: 12px 16px;
    border-radius: 12px;
    background: #111827;
    color: #f8fafc;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.01em;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    touch-action: none;
}

.test-button :deep(.input-element) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 140px;
    min-height: 44px;
}

.test-button[data-pressed="true"],
.test-button :deep(.input-element[data-pressed="true"]) {
    transform: translateY(2px);
    background: #0f172a;
}
</style>