/**
 * inputRouter.js - Platform input wiring
 *
 * Responsibilities:
 * - Detect platform using APP_SETTINGS.platform
 * - Wire event sources once
 * - Route events to intentEngine
 *
 * Rules:
 * - No DOM logic
 * - No rendering calls
 */

import { APP_SETTINGS } from '../../config/appSettings'
import { log } from '../../debug/functions'
import { intentEngine } from './intentEngine'

let currentSeqId = 0

let initialized = false

export function initInputSystem() {
  if (initialized) return
  initialized = true

  if (APP_SETTINGS.platform === 'android') {
    initAndroidInput()
  } else {
    initBrowserInput()
  }
}

function initAndroidInput() {
  window.handleTouch = handleAndroidTouch
  log('init', 'Initialized in Android mode')
}

function initBrowserInput() {
  window.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
  log('init', 'Initialized in Browser mode')
}

window.initAndroidEngine = () => {
  log('init', 'Android engine confirmed')
  return 'success'
}

function handleAndroidTouch(type, x, y, seqId) {
  if (type === 'down') {
    currentSeqId = seqId
  } else if (seqId !== currentSeqId) {
    return
  }

  switch (type) {
    case 'down':
      intentEngine.onDown(x, y)
      break
    case 'move':
      intentEngine.onMove(x, y)
      break
    case 'up':
      intentEngine.onUp()
      break
  }
}

function onPointerDown(e) {
  intentEngine.onDown(e.clientX, e.clientY)
}

function onPointerMove(e) {
  intentEngine.onMove(e.clientX, e.clientY)
}

function onPointerUp() {
  intentEngine.onUp()
}
