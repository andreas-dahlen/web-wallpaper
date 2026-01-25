//future TS type contracts

// ----------------------------
// 1. Intent Mapper Types
// ----------------------------

// type Point = { x: number; y: number }

// type PressIntent = {
//   type: 'press'
//   delta: Point
// }

// type PressReleaseIntent = {
//   type: 'pressRelease'
//   delta: Point
// }

// type SwipeStartIntent = {
//   type: 'swipe-start'
//   delta: Point
//   axis: 'horizontal' | 'vertical'
// }

// type SwipeIntent = {
//   type: 'swipe'
//   axis: 'horizontal' | 'vertical' | 'both'
//   delta: number | Point
// }

// type SwipeEndIntent = {
//   type: 'swipe-end'
//   axis: 'horizontal' | 'vertical' | 'both'
//   delta: number | Point
// }

// // Union type for all intents
// type Intent =
//   | PressIntent
//   | PressReleaseIntent
//   | SwipeStartIntent
//   | SwipeIntent
//   | SwipeEndIntent

// // ----------------------------
// // 2. DOM Registry / Reaction Flags
// // ----------------------------

// // Declare flags: do the elements declare that they *could* support this?
// type Declares = {
//   press: boolean
//   swipe: boolean
//   select: boolean
// }

// // React flags: only true if declared, or explicitly set
// type ReactFlags = {
//   press: boolean
//   pressRelease: boolean
//   pressCancel: boolean
//   swipeStart: boolean
//   swipe: boolean
//   swipeCommit: boolean
//   swipeRevert: boolean
//   select?: boolean
//   deselect?: boolean
// }

// // Full element record
// type DOMRegistryEntry = {
//   element: HTMLElement
//   laneId?: string
//   direction?: 'horizontal' | 'vertical'
//   swipeType?: 'carousel' | 'slider' | 'drag'
//   declares: Declares
//   reacts: ReactFlags
// }

// // ----------------------------
// // 3. Descripor Builder
// // ----------------------------
// // Press and release type descriptors
//      type: String
//      element: HTMLElement 
//      action: ActionObject
//      delta: Point

// // swipeStart descriptor
//         type: string
//         element: HTMLElement
//         laneId: target.laneId,
//         previousElement: previousTarget?.element ?? null,
//         delta: Point

// //swipeType descriptors
//       type,
//       swipeType: target.swipeType,
//       element: HTMLElement
//       delta: number | Point
//       direction: intent.axis,
//       laneId: target.laneId
