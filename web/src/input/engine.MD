Gesture / Input Engine – Architecture & Contracts

This engine provides a platform-agnostic gesture pipeline that converts raw input into declarative reactions, without coupling to DOM, Vue, or animation logic.

It is designed to run identically in:

Web (browser)

Android APK (WebView bridge)

High-level Flow
Platform Input
   ↓
inputRouter
   ↓
intentEngine
   ↓
engineAdapter
   ↓
reactionResolver
   ↓
renderer
   ↓
CSS / swipeState / Vue


Each stage has strict responsibilities and hard rules.

1. inputRouter.js

Platform input wiring

/**
 * inputRouter.js - Platform input wiring
 */

Responsibilities

Detect current platform (APP_SETTINGS.platform)

Attach the correct native event listeners once

Normalize events into (x, y) coordinates

Forward events to intentEngine

Rules

❌ No DOM queries

❌ No gesture logic

❌ No renderer calls

❌ No Vue interaction

Output

Calls exactly one of:

intentEngine.onDown(x, y)

intentEngine.onMove(x, y)

intentEngine.onUp(x, y)

This file is pure wiring.

2. intentEngine.js

Input intent state machine

/**
 * intentEngine.js - Input intent state machine
 */

Responsibilities

Track pointer lifecycle

Maintain gesture phase:

IDLE

PENDING

SWIPING

Detect:

press

release

swipe axis

swipe direction

Accumulate swipe delta

Rules

❌ MUST NOT touch DOM

❌ MUST NOT know about lanes

❌ MUST NOT know about components

❌ MUST NOT trigger CSS

❌ MUST NOT call renderer

Allowed Knowledge

Pointer math

Axis detection

Delta accumulation

Timing

Output Contract

The engine never emits reactions directly.
It forwards intent to the adapter:

engineAdapter.onGestureStart(x, y)

engineAdapter.onSwipeStart(x, y, axis)

engineAdapter.onDrag({ axis, delta })

engineAdapter.onSwipeEnd({ axis, direction, delta })

engineAdapter.onSwipeCancel()

engineAdapter.onRelease({ x, y })

3. engineAdapter.js

Intent → reaction bridge

/**
 * engineAdapter.js - Intent Bridge
 */

Responsibilities

Bridge intentEngine → reactionResolver

Ask domain questions (e.g. “should swipe start?”)

Forward reaction descriptors to the renderer

Rules

❌ No DOM access

❌ No platform branching

❌ No animation logic

❌ No state storage

Key Role

This is the only layer allowed to:

ask reactionResolver.shouldStartSwipe

call reactionResolver.onSwipeStart, onDrag, etc.

forward returned descriptors to renderer.handleReaction(...)

The adapter does not modify descriptors.

4. reactionResolver.js

Domain resolution & eligibility

/**
 * reactionResolver.js - Intent → reaction descriptors
 */

Responsibilities

Resolve what should react at (x, y)

Use domRegistry to:

find action targets

find swipe lanes

Enforce gesture eligibility rules

Decide:

press vs swipe

lane vs fallback

cancel vs release

Allowed Knowledge

DOM structure (via domRegistry)

Device metrics (domState)

Swipe sizing rules (swipeState)

Reaction schema

Rules

❌ MUST NOT touch DOM

❌ MUST NOT mutate state

❌ MUST NOT call renderer

❌ MUST NOT dispatch events

Output

Returns plain reaction descriptors only:

{
  type: 'press' | 'release' | 'swipe-start' | 'swipe' | 'swipe-end' | 'cancel',
  element?: HTMLElement,
  laneId?: string,
  axis?: 'horizontal' | 'vertical',
  direction?: 'left' | 'right' | 'up' | 'down',
  delta?: number,
  actionId?: string
}


If no valid reaction → returns null.

5. renderer.js

Reaction coordinator

/**
 * renderer.js - Reaction coordinator (not animator)
 */

Responsibilities

Apply side effects of reactions:

data-pressed

data-swiping

Update swipeState

Dispatch CustomEvent('reaction') for Vue/app layer

Rules

❌ No gesture detection

❌ No intent logic

❌ No pointer math

❌ No platform logic

This is the ONLY place allowed to:

mutate DOM attributes

mutate swipeState

notify Vue

Supporting State Modules
domState.js

Device dimensions

Density & scale

DebugWrapper integration (web only)

Used by:

reactionResolver (sizing logic)

debugWrapper (visual scaling)

swipeState.js

Lane offsets

Commit thresholds

Lane dragging state

Used by:

reactionResolver (eligibility)

renderer (effects)

Engine Invariants (Non-Negotiable)

intentEngine is math only

resolver returns data, not effects

renderer is the only mutator

data-attributes are declarative hooks

Vue is a consumer, never a driver

APK behavior is the reference model

If a change violates one of these, it is wrong by definition.

Mental Model (TL;DR)

Router: “Where did input come from?”

Engine: “What does the user intend?”

Resolver: “Who is allowed to react?”

Renderer: “Make it visible”

Vue: “Do app stuff”