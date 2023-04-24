<template>
	<div id="divDPad" v-bind:class="{ 'show': show, 'disabled': Studio.isDragging }">
		<KeyButton icon="bp-up" style="top: -0.5rem; left: 2rem;" dir="up" />
		<KeyButton icon="bp-left" style="top: 2rem; left: -0.5rem;" dir="left" />
		<KeyButton icon="bp-right" style="top: 2rem; left: 4.5rem;" dir="right" />
		<KeyButton icon="bp-down" style="top: 4.5rem; left: 2rem;" dir="down" />
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
		overflow: hidden;
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

		div {
			padding: 0.75rem;
			color: white;
			position: absolute;
			line-height: 1;

			/* Create diamond shaped clicking area. */
			transform: rotate(45deg);
		}

		i {
			display: inline-block;
			height: 2rem;
			width: 2rem;
			font-size: 2rem;
			transform: rotate(-45deg);
		}
	}
</style>
