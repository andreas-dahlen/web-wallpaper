<template>
  <div class="layout">

    <SwipeCarousel
      lane="top"
      :scenes="topScenes"
      :width="352"
      :height="262"
      class="lane top"
    />

    <SwipeCarousel
      lane="mid"
      :scenes="midScenes"
      :width="352"
      :height="262"
      class="lane mid"
    />

    <SwipeCarousel
      lane="bottom"
      :scenes="bottomScenes"
      :width="352"
      :height="262"
      class="lane bottom"
    />

  </div>
</template>

<script setup>
import SwipeCarousel from '../components/SwipeCarousel.vue'

import A1 from './lanes/top/1A.vue'
import B1 from './lanes/top/1B.vue'
import C1 from './lanes/top/1C.vue'

import A2 from './lanes/mid/2A.vue'
import B2 from './lanes/mid/2B.vue'
import C2 from './lanes/mid/2C.vue'

import A3 from './lanes/bottom/3A.vue'
import B3 from './lanes/bottom/3B.vue'
import C3 from './lanes/bottom/3C.vue'

const topScenes = [A1, B1, C1]
const midScenes = [A2, B2, C2]
const bottomScenes = [A3, B3, C3]
</script>

<style scoped>
.layout {
  position: relative;
  width: 100%;
  height: 100%;
}

.lane {
  position: absolute;
  left: 0;
}

.top {
  top: 0;
}

.mid {
  top: 262px;
}

.bottom {
  top: 524px;
}
</style>
