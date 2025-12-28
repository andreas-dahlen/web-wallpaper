import { reactive } from 'vue'

export const swipeState = reactive({
  top: 0,
  mid: 0,
  bottom: 0,
  wallpaper: 0
})

// export function swipeNext(lane) {
//   swipeState[lane] = (swipeState[lane] + 1) % 3
// }

// export function swipePrev(lane) {
//   swipeState[lane] =
//     (swipeState[lane] - 1 + 3) % 3
// }