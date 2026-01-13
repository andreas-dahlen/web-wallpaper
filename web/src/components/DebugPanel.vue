<template>
  <div v-if="showPanel" class="debug-panel">
    <div class="row">
      <span class="label">Debug</span>
      <span class="value">Panel enabled</span>
    </div>
  </div>
</template>

<script setup>
import { APP_SETTINGS } from '../config/appSettings'
import { DEBUG } from '../debug/debugFlags';

const showPanel = APP_SETTINGS.debugPanel === true && DEBUG.enabled === true
</script>

<style scoped>
.debug-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: grid;
  gap: 6px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 12px;
  pointer-events: none;
  z-index: 5;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.label {
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 11px;
}

.value {
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: #f8fafc;
}

@media (max-width: 480px) {
  .debug-panel {
    font-size: 11px;
    padding: 8px 10px;
  }
}
</style>
