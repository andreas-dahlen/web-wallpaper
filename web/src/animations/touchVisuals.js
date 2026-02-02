// set pressed state
export function press(el) {
  el.style.setProperty('--touch-bg', 'var(--touch-pressed)');
}

export function release(el) {
  el.style.setProperty('--touch-bg', 'var(--touch-release)');
  setTimeout(() => el.style.removeProperty('--touch-bg'), 200);
}

export function cancel(el) {
  el.style.removeProperty('--touch-bg');
}

export function swipe(el, dir) {
  el.style.setProperty('--touch-bg', `var(--touch-swipe-${dir})`);
}

export function swipeCommit(el) {
  el.style.removeProperty('--touch-bg');
}
