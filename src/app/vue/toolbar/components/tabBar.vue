<template>
	<div id="divTab" class="flex-grow-1" :class="{ 'hide': !Workspace.ids.length }" @wheel.passive="tabWheel($event)"
		 ref="tab">
		<!-- It is VERY important to use only the id numbers in Draggable,
			not the actual Project instances. Otherwise GC will fail. -->
		<Draggable v-bind="dragOption" :list="Workspace.ids" v-if="Studio.initialized">
			<template #item="{ element }: { element: number }">
				<Tab :id="element" @menu="contextMenu($event, element)" />
			</template>
		</Draggable>
	</div>
	<TabMenu ref="tabMenu" />
</template>

<script lang="ts">
	declare const VueDraggable: typeof draggable;
	export default { name: "TabBar" };
</script>

<script setup lang="ts">

	import { defineAsyncComponent, shallowRef } from "vue";

	import { compRef } from "app/inject";
	import Workspace from "app/services/workspaceService";
	import Studio from "app/services/studioService";
	import Lib from "app/services/libService";
	import Tab from "./tab.vue";
	import TabMenu from "./tabMenu.vue";

	import type draggable from "vuedraggable";

	const dragOption = {
		delay: 500,
		delayOnTouchOnly: true,
		touchStartThreshold: 20,
		animation: 200,
		forceFallback: true,
		fallbackTolerance: 5,
		direction: "horizontal",
		scroll: true,
		itemKey: "id",
	};

	// Lazy loading of VueDraggable to improve startup performance
	const Draggable = defineAsyncComponent(() => Lib.ready.then(() => VueDraggable));

	const tab = shallowRef<HTMLDivElement>();
	const tabMenu = compRef(TabMenu);

	function tabWheel(event: WheelEvent): void {
		const DELTA_UNIT = 5;
		if(event.deltaX == 0) {
			tab.value!.scrollLeft -= event.deltaY / DELTA_UNIT;
		}
	}

	function contextMenu(event: MouseEvent, id: number): void {
		event.preventDefault();
		tabMenu.value!.show(event, id);
	}

</script>

<style lang="scss">
	#divTab {
		overflow-x: scroll;
		overflow-y: hidden;
		-ms-overflow-style: none;
		scrollbar-width: none;
		margin: -0.5rem 0.5rem;
		height: 3.75rem;
		white-space: nowrap;

		&::-webkit-scrollbar {
			display: none;
		}

		&.hide {
			visibility: hidden;
		}

		* {
			/* stylelint-disable-next-line plugin/no-unsupported-browser-features */
			touch-action: pan-x;
		}

		> div {
			position: relative;
			height: 100%;
		}
	}

	@media (max-width: 650px) {
		#divTab {
			position: absolute;
			top: 3.75rem;
			left: 0;
			margin: 0;
			width: 100vw;
			height: 2.4rem;
			background: var(--bg-ui);
			border-top: 1px solid gray;
		}
	}
</style>
