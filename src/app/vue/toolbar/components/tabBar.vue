<template>
	<div id="divTab" class="flex-grow-1" :class="{ 'hide': !Workspace.projects.length }" @wheel.passive="tabWheel($event)"
		 ref="tab">
		<Draggable v-bind="dragOption" :list="Workspace.projects" v-if="Studio.initialized">
			<template #item="{ element }: { element: Project }">
				<Tab :id="element.id" @menu="contextMenu($event, element.id)" />
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
	import type { Project } from "client/project/project";

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

	// 延遲載入 VueDraggable 程式庫，以增進啟動效能
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
