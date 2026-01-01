// simple global event bus for gestures
const listeners = new Map() // eventName => Set<callback>

export const gestureBus = {
    on(eventName, cb) {
        if (!listeners.has(eventName)) listeners.set(eventName, new Set())
        listeners.get(eventName).add(cb)
    },
    off(eventName, cb) {
        listeners.get(eventName)?.delete(cb)
    },
    emit(eventName, data) {
        listeners.get(eventName)?.forEach(cb => cb(data))
    }
}
