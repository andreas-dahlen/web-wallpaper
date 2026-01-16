# Gesture / Input Engine — System Integrity Audit Prompt

You are an expert systems-level frontend engineer auditing a **gesture / input engine** used across **Web** and **Android WebView (APK)**.

Your task is to **verify correctness, architectural integrity, and contract adherence** — **not** to redesign the system.

This engine converts raw pointer input into declarative reactions through a strict, layered pipeline.

---

## 🎯 Goal

Analyze the current codebase and determine:

- Whether the system **works as intended**
- Where **bugs, edge cases, or stuck states** may exist
- Where **architectural boundaries are violated**
- Where **logic lives in the wrong layer**
- Where **state or responsibility leaks**
- Where behavior may **diverge between Web and APK**

Report findings in **plain English**, with:
- File-level references
- Clear explanations
- Concrete, minimal fix suggestions

---

## 📂 Files in Scope (Primary)

Focus especially on:

- `domRegistry.js`
- `engineAdapter.js`
- `inputRouter.js`
- `intentEngine.js`
- `reactionResolver.js`
- `renderer.js`
- `domState.js`
- `swipeState.js`

Reference other files **only if required** to explain an issue.

---

## 🧠 Architecture: Non-Negotiable Contracts

### High-Level Flow

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

---

## 1️⃣ inputRouter.js — Platform Wiring Only

**Responsibilities**
- Detect platform
- Attach native listeners once
- Normalize events to `(x, y)`
- Forward input to `intentEngine`

**Rules**
- ❌ No DOM queries
- ❌ No gesture logic
- ❌ No renderer calls
- ❌ No Vue interaction

**Output**
Calls exactly one of:
- `intentEngine.onDown(x, y)`
- `intentEngine.onMove(x, y)`
- `intentEngine.onUp(x, y)`

This file is **pure wiring**.

---

## 2️⃣ intentEngine.js — Intent State Machine (Math Only)

**Responsibilities**
- Track pointer lifecycle
- Maintain gesture phases:
  - `IDLE`
  - `PENDING`
  - `SWIPING`
- Detect:
  - press
  - release
  - swipe axis
  - swipe direction
- Accumulate swipe delta

**Rules**
- ❌ MUST NOT touch DOM
- ❌ MUST NOT know about lanes
- ❌ MUST NOT know about components
- ❌ MUST NOT trigger CSS
- ❌ MUST NOT call renderer

**Allowed Knowledge**
- Pointer math
- Axis detection
- Delta accumulation
- Timing

**Output Contract**

The engine **never emits reactions directly**.  
It forwards intent to `engineAdapter` only:

- `onPress(x, y)`
- `onSwipeStart(x, y, axis)`
- `onSwipe(intent)`
- `onSwipeCommit(intent)`
- `onSwipeRevert()`
- `onPressRelease(intent)`
- `onPressCancel(intent)`

(these should be moved at some point. Engine shouldn't need to know about commitThreshold probably... maybe know about at what threshold swipe should start is good though)
- `shouldStartSwipe(delta, axis)`
- `shouldCommitSwipe(delta, axis)`


---

## 3️⃣ engineAdapter.js — Intent → Reaction Bridge

**Responsibilities**
- Bridge `intentEngine` → `reactionResolver`
- Ask domain questions:
  - `shouldStartSwipe`
  - `shouldCommitSwipe`
- Forward **reaction descriptors** to `renderer`

**Rules**
- ❌ No DOM access
- ❌ No platform branching
- ❌ No animation logic
- ❌ No state storage
- ❌ No mutation of descriptors

This layer **does not decide behavior** — it only asks questions and forwards answers.

---

## 4️⃣ reactionResolver.js — Domain Resolution & Eligibility

**Responsibilities**
- Resolve *who* may react at `(x, y)`
- Use `domRegistry` to:
  - find action targets
  - find swipe lanes
- Enforce eligibility rules:
  - press vs swipe
  - cancel vs release
  - lane vs fallback
  - swipeType and direction

**Allowed Knowledge**
- DOM structure (via `domRegistry`)
- Device metrics (`domState`)
- Swipe sizing rules (`swipeState`)
- Reaction schema

**Rules**
- ❌ MUST NOT touch DOM
- ❌ MUST NOT mutate state
- ❌ MUST NOT call renderer
- ❌ MUST NOT dispatch events

**Output**
Returns **plain reaction descriptors only**:

```js
{
  type: 'press' | 'pressRelease' | 'pressCancel'
      | 'swipeStart' | 'swipe' | 'swipeCommit' | 'swipeRevert'
      | 'select' | 'deselect',
  element?: HTMLElement,
  laneId?: string,
  axis?: 'horizontal' | 'vertical',
  direction?: 'left' | 'right' | 'up' | 'down',
  delta?: number | { x: number, y: number },
  actionId?: string
}

5️⃣ renderer.js — Reaction Side-Effects Only

Responsibilities

Apply side effects of reactions:

DOM data-* attributes

swipeState mutation

Dispatch CustomEvent('reaction') for Vue/app layer

Rules

❌ No gesture detection

❌ No intent logic

❌ No pointer math

❌ No platform logic

This is the ONLY layer allowed to:

Mutate DOM attributes

Mutate swipeState

Notify Vue

📦 Supporting State Modules
domState.js

Viewport sizing

Device metrics

Density / scale helpers

Debug wrapper integration (web only)

Used by:

reactionResolver

debug tooling

swipeState.js

Lane offsets

Commit thresholds

ging state

Used by:

reactionResolver (eligibility)

renderer (effects)

🔒 Engine Invariants (Absolute)

If any of these are violated, the system is incorrect by definition:

intentEngine is math only

resolver returns data, not effects

renderer is the only mutator

data-attributes are declarative hooks

Vue is a consumer, never a driver

APK behavior is the reference model

🧪 What You Must Audit

Broken gesture flows

Stuck pressed / swiping states

Missing cancel paths

Incorrect release handling

Responsibility leaks

Logic in wrong layer

Renderer doing resolver work

Resolver mutating state

Adapter storing state

Swipe correctness

Axis locking

swipeType handling

Threshold usage

Lane fallback behavior

State consistency

swipeState lifecycle

pressedTarget clearing

lane ownership

Cross-platform risk

Web-only assumptions

WebView-breaking logic

📄 Output Format (STRICT)

Produce a structured report with the following sections:

✅ System Health Summary

Overall assessment: Stable / Risky / Broken

Key risks at a glance

⚠️ Issues Found

For each issue, include:

Title

Severity: Low / Medium / High / Critical

File(s)

What’s wrong (plain English)

Why it violates the architecture

How to fix it (specific, minimal)

🔍 Design Drift Warnings (If Any)

Call out places where:

Logic technically works

But violates the intended mental model

🛡️ Invariants Check

Explicitly state:

Which invariants are upheld

Which are violated (if any)

🧠 Final Verdict

Answer clearly:

Is the system architecturally sound?

Is it maintainable?

Is it safe to extend?

🚫 Hard Constraints

❌ Do NOT rewrite the system

❌ Do NOT suggest future improvements

❌ Do NOT introduce new abstractions

❌ Do NOT refactor unless required to fix a real issue

❌ Do NOT optimize prematurely