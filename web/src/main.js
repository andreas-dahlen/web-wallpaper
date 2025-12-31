import { createApp } from 'vue'
import App from './App.vue'
import './input/nativeBridge'
import './styles/main.css'
import { gestureBusLog } from './input/debugInput'

gestureBusLog()
createApp(App).mount('#app')
