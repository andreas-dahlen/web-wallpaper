// src/state/swipeState.js
import { reactive } from 'vue'

export const swipeState = reactive({
  lanes: {}
//     [top]: {
//       index: 0,
//       offset: 0,   // drag offset in px or normalized units
//       count: 0     // number of items in lane
//     },
//     [mid]: {
//       index: 0,
//       offset: 0,   // drag offset in px or normalized units
//       count: 0     // number of items in lane
//     },
//     [bottom]: {
//       index: 0,
//       offset: 0,   // drag offset in px or normalized units
//       count: 0     // number of items in lane
//     },
//     [wallpaper]: {
//       index: 0,
//       offset: 0,   // drag offset in px or normalized units
//       count: 0     // number of items in lane
//     }
//   }
})

/* -------------------------
   Lane helpers
-------------------------- */

export function ensureLane(laneId) {
  if (!swipeState.lanes[laneId]) {
    swipeState.lanes[laneId] = {
      index: 0,
      offset: 0,
      count: 0
    }
  }
  return swipeState.lanes[laneId]
}

export function setLaneCount(laneId, count) {
  const lane = ensureLane(laneId)
  lane.count = Math.max(0, count)
  lane.index = clamp(lane.index, 0, lane.count - 1)
}

export function setLaneIndex(laneId, index) {
  const lane = ensureLane(laneId)
  lane.index = clamp(index, 0, lane.count - 1)
  lane.offset = 0
}

export function applyLaneOffset(laneId, offset) {
  const lane = ensureLane(laneId)
  lane.offset = offset
}

export function commitLaneSwipe(laneId, direction) {
  const lane = ensureLane(laneId)
  if (direction === 'left') lane.index++
  if (direction === 'right') lane.index--
  lane.index = clamp(lane.index, 0, lane.count - 1)
  lane.offset = 0
}

/* -------------------------
   Utils
-------------------------- */

function clamp(v, min, max) {
  if (max < min) return min
  return Math.min(max, Math.max(min, v))
}