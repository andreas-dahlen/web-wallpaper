<template>
    <div class="swipe-area-box">

        <TouchArea class="swipe-area swipe-area-1" 
        :onSwipeStart="onSwipeStart1"
        :onSwipeRelease="onSwipeRelease"
        :onSwipe="{
            left: onSwipeLeft, 
            right: onSwipeRight 
            }"
        />

        <TouchArea class="swipe-area swipe-area-2" 
        :onSwipeStart="onSwipeStart2"
        :onSwipeRelease="onSwipeRelease"
        :onSwipe="{ 
            left: onSwipeLeft,
            right: onSwipeRight
            }"
        />

        <TouchArea class="swipe-area swipe-area-3" 
        :onSwipeStart="onSwipeStart3"
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
import { swipeEngine } from '../input/swipeEngine'
// import { swipeEnd } from '../../animations/touchVisuals';
// import {swipeNext, swipePrev } from './lanes/SwipeState'

defineOptions({ name: 'SwipeZone' })

function onSwipeStart1(data) {swipeEngine.handleSwipeStart(data, 'top')}
function onSwipeStart2(data) {swipeEngine.handleSwipeStart(data, 'mid')}
function onSwipeStart3(data) {swipeEngine.handleSwipeStart(data, 'bottom')}

function onSwipeLeft(data) {swipeEngine.handleSwipeMove(data)}
function onSwipeRight(data) {swipeEngine.handleSwipeMove(data)}

function onSwipeRelease(data) {swipeEngine.handleSwipeRelease(data)}

// function onSwipeLeft1(dir) {
//     console.log('i will call swipe left')


// function onSwipeRight1(dir) {
//     console.log('i will call wipe right')

// }

// function onSwipeLeft2(dir) {
//     console.log('i will call swipe left')

// }

// function onSwipeRight2(dir) {
//     console.log('i will call wipe right')

// }
// function onSwipeLeft3(dir) {
//     console.log('i will call swipe left')

// }

// function onSwipeRight3(dir) {
//     console.log('i will call wipe right')

// }
// function onPress() {
    // press(el)
    // console.log('SWIPEZONE: press')
// }
// function onRelease() {
    // release(el)
    // console.log('SWIPEZONE: release')
// }
// function onCancel(el) {
//     cancel(el)
//     console.log('SWIPEZONE: cancel')
// }
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