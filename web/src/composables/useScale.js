// composables/useScale.js
// Disabled on web to avoid double-scaling; kept as a no-op utility.
// import { onMounted, onBeforeUnmount } from 'vue'

// let currentScale = 1

// export function useScale() {
//   function noop() {
//     currentScale = 1
//     if (typeof window !== 'undefined') {
//       window.__APP_SCALE = 1
//     }
//   }

//   onMounted(noop)
//   onBeforeUnmount(() => {})

//   return {
//     getScale: () => currentScale
//   }
// }

