<template>
	<Transition name="toast">
		<div
			v-if="visible"
			id="divToast"
			class="toast show text-bg-info border-0"
			role="status"
			aria-live="polite"
		>
			<div class="toast-body">{{ message }}</div>
		</div>
	</Transition>
</template>

<script setup lang="ts">

	import ToastService from "app/services/toastService";

	defineOptions({ name: "Toast" });

	const { message, visible } = ToastService;

</script>

<style lang="scss">
	/* Float up when shown, and fade out when hidden. */
	.toast-enter-active {
		transition: opacity 0.2s ease-out, transform 0.2s ease-out;
	}

	.toast-enter-from {
		transform: translateY(1rem);
		opacity: 0;
	}

	.toast-leave-active {
		transition: opacity 0.4s ease-in;
	}

	.toast-leave-to {
		opacity: 0;
	}
</style>
