<template>
	<div id="divSpinner" class="viewport" :class="{ 'shift-down': Workspace.ids.length, 'show': visible }">
		<div class="h-100 d-flex text-center align-items-center">
			<div style="font-size: 10rem; font-size: min(15vh, 15vw); color: gray; flex-grow: 1;">
				<i class="bp-spinner fa-spin" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	export default { name: "Spinner" };
</script>

<script setup lang="ts">

	import { computed, shallowRef } from "vue";

	import Core from "app/core";
	import Workspace from "app/services/workspaceService";

	const loading = shallowRef(false);
	const visible = computed(() => !Core.lcpReady || loading.value);
	const ONE_SECOND = 1000;

	function show(): Promise<void> {
		loading.value = true;

		/**
		 * In Safari, if you continue to execute JavaScript without waiting for the animation to start,
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
			transition: opacity 0.5s cubic-bezier(1, 0, 0, 0);
			opacity: 0;
		}

		&.show {
			visibility: visible;

			> div {
				opacity: 1;
			}
		}
	}
</style>
