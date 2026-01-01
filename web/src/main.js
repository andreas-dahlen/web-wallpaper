// main.js
import { createApp } from 'vue'
import App from './App.vue'

import './styles/main.css'

import { initInputSystem } from './bootstrap/initInputSystem'

// One call. One responsibility.
initInputSystem()

// Create and mount the Vue app
createApp(App).mount('#app')
