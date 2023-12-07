<template>
	<div id="divSpinner" class="viewport" :class="{ 'shift-down': Workspace.ids.value.length, 'show': visible }">
		<div class="h-100 d-flex text-center align-items-center">
			<div class="spinner-container">
				<i class="bp-spinner fa-spin" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">

	import { computed, shallowRef } from "vue";

	import { lcpReady } from "app/misc/lcpReady";
	import Workspace from "app/services/workspaceService";

	defineOptions({ name: "Spinner" });

	const loading = shallowRef(false);
	const visible = computed(() => !lcpReady.value || loading.value);

	const ONE_SECOND = 1000;

	function show(): Promise<void> {
		loading.value = true;

		/**
		 * In Safari, if we continue to execute JavaScript without waiting for the animation to start,
		 * The result is that the animation never appears. Using setTimeout to delay is of course one option,
		 * but we don't know exactly how long the delay is enough, and it's unnecessary waiting for other browsers,
		 * so here I set a Promise to make sure the animation starts before moving on to the next step.
		 */
		return new Promise<void>(resolve => {
			// Just to be sure we set a one second timeout to avoid Promise hanging forever
			setTimeout(() => resolve(), ONE_SECOND);
			const el = document.getElementById("divSpinner")!;
			el.addEventListener("transitionstart", () => resolve(), { once: true });
		});
	}

	function hide(): void {
		loading.value = false;
	}

	defineExpose({
		show,
		hide,
	});

</script>

<style lang="scss">
	#divSpinner {
		visibility: hidden;

		/* The combination of this CSS makes Spinner to appear gradually, but vanishes instantly */
		> div {
			opacity: 0;
			transition: opacity 0.5s cubic-bezier(1, 0, 0, 0);
		}

		&.show {
			visibility: visible;

			> div {
				opacity: 1;
			}
		}
	}

	.spinner-container {
		flex-grow: 1;
		font-size: 10rem;
		/* stylelint-disable-next-line plugin/no-unsupported-browser-features */
		font-size: min(15vh, 15vw);
		color: gray;
	}
</style>
