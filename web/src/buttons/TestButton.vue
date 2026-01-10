<template>
	<button class="test-button" data-action="test">
		Fire Test Action
	</button>
</template>

<script setup>
// No script needed; gestureHandler detects data-action="test" and dispatches a custom event.
</script>

<style scoped>
.test-button {
	position: absolute;
	bottom: 24px;
	right: 24px;
	padding: 12px 16px;
	border: none;
	border-radius: 12px;
	background: #111827;
	color: #f8fafc;
	font-size: 14px;
	font-weight: 600;
	letter-spacing: 0.01em;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
	cursor: pointer;
	touch-action: none;
}

.test-button:active {
	transform: translateY(1px);
	background: #0f172a;
}
</style>