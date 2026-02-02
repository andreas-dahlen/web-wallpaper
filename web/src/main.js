// main.js
import { createApp } from 'vue'
import App from './App.vue'

import './styles/main.css'
import { APP_SETTINGS } from './config/appSettings'
import { log } from './debug/functions'

// Input router selects platform wiring for the intent engine
import { initInputSystem } from './interaction/input/inputRouter'
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

// Initialize input system after Vue mounts (ensures DOM is ready)
initInputSystem()

// Apply CSS variables from JS after DOM is ready
applyRuntimeLayout()

// Refresh layout when Android injects device dimensions
window.addEventListener('phone:metrics', applyRuntimeLayout)