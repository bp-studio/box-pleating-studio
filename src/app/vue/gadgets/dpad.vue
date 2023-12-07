<template>
	<div id="divDPad" v-bind:class="{ 'show': show, 'disabled': Studio.isDragging }">
		<KeyButton icon="bp-up" style="top: -0.5rem; left: 2rem;" dir="up" />
		<KeyButton icon="bp-left" style="top: 2rem; left: -0.5rem;" dir="left" />
		<KeyButton icon="bp-right" style="top: 2rem; left: 4.5rem;" dir="right" />
		<KeyButton icon="bp-down" style="top: 4.5rem; left: 2rem;" dir="down" />
	</div>
</template>

<script setup lang="ts">

	import { computed } from "vue";

	import Studio, { showPanel } from "app/services/studioService";
	import KeyButton from "./keyButton.vue";

	defineOptions({ name: "DPad" });

	const show = computed(() => Studio.shouldShowDPad && !showPanel.value);

</script>

<style lang="scss">
	#divDPad {
		pointer-events: none;

		position: absolute;
		z-index: 100;
		bottom: 1rem;
		left: 1rem;

		overflow: hidden;

		width: 7.5rem;
		height: 7.5rem;

		opacity: 0;
		background-color: var(--bs-primary);
		border-radius: 3.75rem;

		/* Vanishing is faster */
		transition-duration: 0.1s;
		transition-property: opacity;

		&.show {
			pointer-events: all;
			opacity: 0.8;

			/* Slightly delay displaying to avoid glitches in multiple touches */
			transition-delay: 60ms;
			transition-duration: 0.2s;

			&.disabled {
				pointer-events: none;
				opacity: 0.5;
			}
		}

		div {
			position: absolute;

			/* Create diamond shaped clicking area. */
			transform: rotate(45deg);

			padding: 0.75rem;

			line-height: 1;
			color: white;
		}

		i {
			transform: rotate(-45deg);

			display: inline-block;

			width: 2rem;
			height: 2rem;

			font-size: 2rem;
		}
	}
</style>
