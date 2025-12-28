<template>
    <div class="swipe-area-box">
        <TouchArea class="swipe-area swipe-area-1" id="topLane" 
            :onSwipeStart="onSwipeStart"
            :onSwipeRelease="onSwipeRelease" 
            :onSwipe="{
                left: onSwipeLeft,
                right: onSwipeRight
            }" />
        <TouchArea class="swipe-area swipe-area-2" id="midLane"
            :onSwipeStart="onSwipeStart"
            :onSwipeRelease="onSwipeRelease" 
            :onSwipe="{
                left: onSwipeLeft,
                right: onSwipeRight
            }" />
        <TouchArea class="swipe-area swipe-area-3" id="bottomLane" 
            :onSwipeStart="onSwipeStart"
            :onSwipeRelease="onSwipeRelease" 
            :onSwipe="{
                left: onSwipeLeft,
                right: onSwipeRight
            }" />
    </div>
    <div class="swipe-area-box">
        <TouchArea class="swipe-area-wallpaper" id="wallpaperLane" 
            :onSwipeStart="onSwipeStart"
            :onSwipeRelease="onSwipeRelease" 
            :onSwipe="{
                up: onSwipeMove,
                down: onSwipeMove
            }" />
    </div>

</template>

<script setup>
import TouchArea from './TouchArea.vue'
import { swipeEngine } from '../input/swipeEngine'
import { APP_SETTINGS } from '../config/appSettings'

defineOptions({ name: 'SwipeZone' })

const laneWidth = APP_SETTINGS.ui.laneWidth
const laneHeight = APP_SETTINGS.ui.wallpaperHeight

const elToLane = {
    topLane: 'top',
    midLane: 'mid',
    bottomLane: 'bottom',
    wallpaperLane: 'wallpaper'
}

function getLaneFromEl(el) {
    return elToLane[el.id] ?? null
}

function onSwipeStart(data) {
    const lane = getLaneFromEl(data.el)
    swipeEngine.handleSwipeStart(data, lane)
}

function onSwipeLeft(data) {
    const lane = getLaneFromEl(data.el)
    swipeEngine.handleSwipeMove(data, lane)
}

function onSwipeRight(data) {
    const lane = getLaneFromEl(data.el)
    swipeEngine.handleSwipeMove(data, lane)
}

function onSwipeMove(data) {
    swipeEngine.handleSwipeMove(data, 'wallpaper')
}

function onSwipeRelease(data) {
    const lane = getLaneFromEl(data.el)
    if (lane === 'wallpaper') {
        swipeEngine.handleSwipeRelease(data, lane, laneHeight)
    } else {
        swipeEngine.handleSwipeRelease(data, lane, laneWidth)
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
    height: 265px;
    opacity: 0%;
    /* pointer-events:none; */
    transition: background-color 0.3s ease;
}

.swipe-area-wallpaper {
    width: 352px;
    height: 784px;
    opacity: 0%;
    /* pointer-events:none; */
    transition: background-color 0.3s ease;
}
</style>