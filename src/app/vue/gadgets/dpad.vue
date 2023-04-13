<template>
	<div id="divDPad" v-bind:class="{ 'show': show, 'disabled': Studio.isDragging }">
		<KeyButton class="bp-up" style="top: 0; left: 2.5rem;" dir="up" />
		<KeyButton class="bp-left" style="top: 2.5rem;left: 0;" dir="left" />
		<KeyButton class="bp-right" style="top: 2.5rem;left: 5rem;" dir="right" />
		<KeyButton class="bp-down" style="top: 5rem; left: 2.5rem;" dir="down" />
	</div>
</template>

<script lang="ts">
	export default { name: "DPad" };
</script>

<script setup lang="ts">

	import { computed } from "vue";

	import Studio, { showPanel } from "app/services/studioService";
	import KeyButton from "./keyButton.vue";

	const show = computed(() => Studio.shouldShowDPad && !showPanel.value);

</script>

<style lang="scss">
	#divDPad {
		height: 7.5rem;
		width: 7.5rem;
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		border-radius: 3.75rem;
		background-color: var(--bs-primary);
		opacity: 0;
		pointer-events: none;
		transition-property: opacity;

		/* Vanishing is faster */
		transition-duration: 0.1s;
		z-index: 100;

		&.show {
			pointer-events: all;

			/* Slightly delay displaying to avoid glitches in multiple touches */
			transition-delay: 60ms;
			transition-duration: 0.2s;
			opacity: 0.8;

			&.disabled {
				pointer-events: none;
				opacity: 0.5;
			}
		}

		i {
			padding: 0.25rem;
			height: 2.5rem;
			width: 2.5rem;
			font-size: 2rem;
			color: white;
			position: absolute;
		}
	}
</style>
