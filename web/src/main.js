// main.js
import { createApp } from 'vue'
import App from './App.vue'

import './styles/main.css'

import { initInputSystem } from './bootstrap/initInputSystem'
import './bootstrap/initAndroidBridge'
import { initPerfDebug } from './bootstrap/initPerfDebug'

// One call. One responsibility.
initInputSystem()
initPerfDebug()

// Create and mount the Vue app
createApp(App).mount('#app')
