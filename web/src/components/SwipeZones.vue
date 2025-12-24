<template>
    <div class="swipe-area-box">

        <TouchArea class="swipe-area swipe-area-1" :onPress="onPress" :onRelease="onRelease" :onPressCancel="onCancel"
            :onSwipe="onSwipe">
        </TouchArea>

        <TouchArea class="swipe-area swipe-area-2" :onPress="onPress" :onRelease="onRelease" :onPressCancel="onCancel"
            :onSwipe="onSwipe">
        </TouchArea>

        <TouchArea class="swipe-area swipe-area-3" :onPress="onPress" :onRelease="onRelease" :onPressCancel="onCancel"
            :onSwipe="onSwipe">
        </TouchArea>

    </div>
</template>

<script setup>
import TouchArea from './TouchArea.vue'
import { press, release, cancel, swipe } from '../animations/touchVisuals';

defineOptions({ name: 'SwipeZone' })


const emit = defineEmits(['screen-swipe'])

function onPress(el) {
    press(el)
    console.log('press')
}
function onRelease(el) {
    release(el)
    console.log('release')
}
function onCancel(el) {
    cancel(el)
    console.log('cancel')
}
function onSwipe(el, dir) {
        console.log('onSwipe: ', dir)
    if (dir === 'up' || dir === 'down') {
        emit('screen-swipe', dir)
        return
    } else {
        swipe(el, dir)
        // console.log(el, dir)
    }
}

</script>

<style scoped>
.swipe-area-box {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
}

.swipe-area {
    width: 352px;
    height: 262px;
    transition: background-color 0.3s ease;
}
</style>