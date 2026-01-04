import { DEBUG } from '../debug/config'
import { startRafDeltaDebug } from '../debug/functions'

// Initialize performance-related debug probes.
export function initPerfDebug() {
  if (DEBUG.enabled && DEBUG.rafDelta) {
    startRafDeltaDebug()
  }
}
