<template>
  <!-- <div id="app">
    <div class="screen">
      <div class="module" @click="count++">
        Taps: {{ count }}
      </div>
    </div>
  </div> -->
  <div class="my-phone"></div>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  /* display: flex; */
  /* justify-content: center;
  align-items: center; */
  background: #ffffff;
}

/* #app { */
  /* width: 100%; */
  /* max-width: 400px;         optional: scale down for desktop preview */
/* } */

/* .screen {
  width: 100%;
  aspect-ratio: 1272 / 2800;
  background: black;
  position: relative;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32px;
}

.module {
  position: absolute;
  top: 100px;  
  left: 200px; 
  width: 300px;
  height: 100px;
  background: rgba(255,255,255,0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
} */

.my-phone {
    width: 320px;
    height: 700px;
    background-color: black;
    border-radius: 40px;
}
</style>
