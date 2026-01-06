<!-- <template>
  <div id="app">
    <div 
      class="phone" 
      :style="{ backgroundColor: phoneColor }"
      @pointerdown="onTouchDown"
      @pointermove="onTouchMove"
      @pointerup="onTouchUp"
    >
      <div class="module" @click="onModuleClick">
        Taps: {{ count }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const count = ref(0)
const phoneColor = ref('black') 
let lastX = null  


function applyScale() {
  const scale = Math.min(
    window.innerWidth / 364,
    window.innerHeight / 800
  )
  const app = document.getElementById('app')
  if (app) {
    app.style.transform = `scale(${scale})`
  }
}

onMounted(() => {
  applyScale()
  window.addEventListener('resize', applyScale)
  document.addEventListener('DOMContentLoaded', applyScale)


  window.handleTouch = (type, x, y) => {
    if (type === 'down') phoneColor.value = 'orange'
    else if (type === 'move') {
      if (lastX !== null) {
        const dx = x - lastX
        if (dx > 10) phoneColor.value = 'green'
        else if (dx < -10) phoneColor.value = 'red'
      }
    } else if (type === 'up') phoneColor.value = 'blue'

    lastX = (type === 'up') ? null : x
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', applyScale)
  document.removeEventListener('DOMContentLoaded', applyScale)
})


function onTouchDown(e) {
  phoneColor.value = 'orange'  
  lastX = e.clientX
}

function onTouchMove(e) {
  if (lastX === null) return
  const dx = e.clientX - lastX
  if (dx > 10) {
    phoneColor.value = 'green'
  } else if (dx < -10) {
    phoneColor.value = 'red'
  }
}

function onTouchUp(e) {
  phoneColor.value = 'blue'
  lastX = null
}

function onModuleClick() {
  count.value++
  phoneColor.value = 'purple'
}
</script>

<style>

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #e5e5e5;
}

#app {
  transform-origin: center center;
}

.phone {
  width: 364px;
  height: 800px;
  border-radius: 40px;
  position: relative;
  overflow: hidden;
  color: white;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.2s ease;
}

.module {
  position: absolute;
  top: 100px;
  left: 32px;
  width: 300px;
  height: 100px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.module:active {
  background: rgba(255, 255, 255, 0.2);
}
</style> -->
