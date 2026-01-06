// animations/touchVisuals.js

// set pressed state
export function press(el) {
  el.style.setProperty('--touch-bg', 'var(--touch-pressed)');
  // console.log("col-press")
}

// set released state (optional, if different)
export function release(el) {
  el.style.setProperty('--touch-bg', 'var(--touch-release)');
    // console.log("col-release")
    setTimeout(() => {
    el.style.removeProperty('--touch-bg')
  }, 200) // ms
}

// revert to default idle state
export function cancel(el) {
  el.style.removeProperty('--touch-bg');
      // console.log("col-cancel")
}

export function swipe(el, dir) {
  el.style.setProperty('--touch-bg', `var(--touch-swipe-${dir})`);
  // console.log(dir)
}

export function swipeEnd(el) {
  el.style.removeProperty('--touch-bg');
}