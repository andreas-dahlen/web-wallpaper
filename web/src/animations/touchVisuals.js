// animations/touchVisuals.js

export function press(el) {
  // set pressed state
  el.style.setProperty('--touch-bg', 'var(--touch-pressed)');
  // console.log("col-press")
}

export function release(el) {
  // set released state (optional, if different)
  el.style.setProperty('--touch-bg', 'var(--touch-release)');
    // console.log("col-release")
}

export function cancel(el) {
  // revert to default idle state
  el.style.removeProperty('--touch-bg');
      // console.log("col-cancel")
}

export function swipe(el, dir) {
  
  el.style.setProperty('--touch-bg', `var(--touch-swipe-${dir})`);
  // console.log(dir)
}
