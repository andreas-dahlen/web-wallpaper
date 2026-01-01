// input/core/inputRouter.js
import { unifiedInputDriver } from '../drivers/unifiedInputDriver'

let activeDriver = null

export function initInputRouter(container = window) {
  activeDriver = unifiedInputDriver
  if (activeDriver?.init) activeDriver.init(container)
}

export function handleInput(type, event) {
  if (!activeDriver) throw new Error('Input driver not initialized')
  activeDriver.handle(type, event)
}
