// import { clampDelta2D, clampSwipe } from './clampMath'
// import { buildRawPosition, normalizeAxis, resolveDirection, sanitizeScale, scalePoint, toNumber } from './swipeMath'

// export function computeSwipeDelta({ payload = {}, target = {}, base = {}, parent, scale = 1 }) {
//   const swipeType = target.swipeType
//   const laneId = target.laneId
//   const scaleFactor = sanitizeScale(scale)

//   if (swipeType === 'drag') {
//     const dragKey = payload.dragKey || laneId || 'default'
//     const basePos = base.drag?.[dragKey]
//     const raw = payload.raw || payload.rawDelta

//     if (!basePos || !raw) return null

//     const scaledRaw = scalePoint(raw, scaleFactor)
//     const scaledBase = scalePoint(basePos, scaleFactor)
//     const delta = {
//       x: scaledRaw.x - scaledBase.x,
//       y: scaledRaw.y - scaledBase.y
//     }

//     const normalizedParent = parent
//       ? {
//           width: toNumber(parent.width) / scaleFactor,
//           height: toNumber(parent.height) / scaleFactor
//         }
//       : undefined

//     const { clamped } = clampDelta2D({
//       type: 'swipeDrag',
//       delta,
//       base: scaledBase,
//       parent: normalizedParent
//     })

//     const absolute = {
//       x: clamped.x * scaleFactor,
//       y: clamped.y * scaleFactor
//     }

//     return {
//       delta: {
//         x: delta.x * scaleFactor,
//         y: delta.y * scaleFactor
//       },
//       absolute,
//       dragKey,
//       axis: resolveDirection(payload.axis || target.laneAxis, Math.abs(delta.x) >= Math.abs(delta.y) ? delta.x : delta.y)
//     }
//   }

//   const axisKey = normalizeAxis(payload.axis || target.laneAxis)
//   const deltaScaled = toNumber(payload.delta) / scaleFactor
//   const baseAxis = toNumber(base.axis?.[laneId]) / scaleFactor
//   const sizeAxis = toNumber(base.size?.[laneId]) / scaleFactor
//   const parentSize = axisKey === 'y'
//     ? toNumber(parent?.height) / scaleFactor
//     : toNumber(parent?.width) / scaleFactor

//   const clampResult = clampSwipe({
//     type: swipeType === 'slider' ? 'swipeSlider' : 'swipeCarousel',
//     axis: axisKey,
//     delta: deltaScaled,
//     base: baseAxis,
//     size: sizeAxis,
//     parentSize
//   })

//   const deltaValue = clampResult.clampedDelta * scaleFactor
//   const axis = resolveDirection(axisKey, deltaValue) || resolveDirection(axisKey, payload.delta)

//   const response = { delta: deltaValue, axis }
//   if (swipeType === 'slider') {
//     response.normalized = clampResult.normalized
//     response.normalizedPercent = clampResult.normalizedPercent
//   }

//   return response
// }

// export function buildDragRaw({ start, totalDelta }) {
//   return buildRawPosition(start, totalDelta)
// }
