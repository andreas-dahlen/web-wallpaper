<template>
  <div class="scene-root a">
    <div class="spin-box" aria-label="spin test" ></div>
    <!-- <div class="label">MID · A</div> -->
  </div>
</template>

<script setup>
defineOptions({ name: 'MidA' })
</script>

<style scoped>
.a {
  background: linear-gradient(135deg, #ff7a7a, #ffb347);
  display: grid;
  place-items: center;
  gap: 0px;
  /* padding: 24px; */
}

.spin-box {
  width: 265px;
  height: 265px;
  border-radius: 24px;
  background: radial-gradient(circle at 30% 30%, #ffe8d1, #ff9f68 60%, #f45b69);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25);
  /* animation: spin 4s linear infinite; */
}

.label {
  color: #2d1b00;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
