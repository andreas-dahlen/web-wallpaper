import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'

// Simplified: Single unified gesture handler replaces complex input system
import { initGestureHandler } from './input/gestureHandler'
import { exportCSS } from './config/exportSettings'

// Create and mount the Vue app
const app = createApp(App)
app.mount('#app')

// Initialize gesture handling after Vue mounts (ensures DOM is ready)
initGestureHandler()

// Apply CSS variables from JS after DOM is ready
exportCSS()
