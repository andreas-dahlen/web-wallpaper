<template>
    <div class="swipe-area-box">

        <TouchArea class="swipe-area swipe-area-1" 
        :onPress="onPress" 
        :onRelease="onRelease" 
        :onPressCancel="onCancel"
        :onSwipeRelease="onSwipeRelease"
        :onSwipe="{ 
            left: onSwipeLeft, 
            right: onSwipeRight 
            }"
        />

        <TouchArea class="swipe-area swipe-area-2" 
        :onPressCancel="onCancel"
        :onSwipeRelease="onSwipeRelease"
        :onSwipe="{ 
            left: onSwipeLeft, 
            right: onSwipeRight 
            }"
        />

        <TouchArea class="swipe-area swipe-area-3" 
        :onPress="onPress" 
        :onRelease="onRelease" 
        :onPressCancel="onCancel"
        :onSwipeRelease="onSwipeRelease"
        :onSwipe="{ 
            left: onSwipeLeft, 
            right: onSwipeRight 
            }"
        />

    </div>
</template>

<script setup>
import TouchArea from './TouchArea.vue'
import { press, release, cancel, swipe, swipeEnd } from '../animations/touchVisuals';

defineOptions({ name: 'SwipeZone' })

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
function onSwipeRelease(el) {
    swipeEnd(el)
    console.log('swipe ENDED: SwipeZones')
}

function onSwipeLeft(el, dir) {
    console.log(dir)
    swipe(el, dir)
}

function onSwipeRight(el, dir) {
    console.log(dir)
    swipe(el, dir)
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
    /* pointer-events:none; */
    transition: background-color 0.3s ease;
}
</style>