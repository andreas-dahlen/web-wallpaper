// input/gestureBus.js
const listeners = new Set()

export const gestureBus = {
  emit(event) {
    for (const fn of listeners) fn(event)
  },

  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }
}
