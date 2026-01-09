// main.js
import './config/platformPreload.js'

import { createApp } from 'vue'
import App from './App.vue'

import './styles/main.css'
import { APP_SETTINGS } from './config/appSettings'
import { log } from './debug/functions'

// Simplified: Single unified gesture handler replaces complex input system
import { initGestureHandler } from './input/gestureHandler'
// import { exportCSS } from './config/exportSettings'

log('init', APP_SETTINGS.platform)

function applyRuntimeLayout() {
	// exportCSS()
	// Reuse existing scaling logic by simulating a resize when dimensions change
	window.dispatchEvent(new Event('layout:refresh'))
}

// Create and mount the Vue app
const app = createApp(App)
app.mount('#app')

// Initialize gesture handling after Vue mounts (ensures DOM is ready)
initGestureHandler()

// Apply CSS variables from JS after DOM is ready
applyRuntimeLayout()

// Refresh layout when Android injects device dimensions
window.addEventListener('phone:metrics', applyRuntimeLayout)