<template>
	<div class="flex-grow-1 tab-container" @wheel.passive="tabWheel($event)">
		<SlickList lockAxis="x" axis="x" v-model:list="Workspace.ids.value" :distance="10" id="divTab"
				   :class="{ 'hide': !Workspace.ids.value.length }">
			<SlickItem v-for="(id, i) in Workspace.ids.value" :key="id" :index="i" class="tab"
					   :class="{ active: Studio.project?.id == id }">
				<Tab :id="id" @menu="contextMenu($event, id)" />
			</SlickItem>
		</SlickList>
	</div>
	<TabMenu ref="tabMenu" />
</template>

<script lang="ts">
	export default { name: "TabBar" };
</script>

<script setup lang="ts">
	import { SlickList, SlickItem } from "vue-slicksort/dist/vue-slicksort.esm.js";

	import { compRef } from "app/inject";
	import Workspace from "app/services/workspaceService";
	import Studio from "app/services/studioService";
	import Tab from "./tab.vue";
	import TabMenu from "./tabMenu.vue";

	const tabMenu = compRef(TabMenu);

	function tabWheel(event: WheelEvent): void {
		const DELTA_UNIT = 5;
		if(event.deltaX == 0) {
			document.getElementById("divTab")!.scrollLeft -= event.deltaY / DELTA_UNIT;
		}
	}

	function contextMenu(event: MouseEvent, id: number): void {
		event.preventDefault();
		tabMenu.value!.show(event, id);
	}

</script>

<style lang="scss">
	.tab-container {
		width: 0;
		margin: -0.5rem 0.5rem;
	}

	#divTab {
		overflow-x: scroll;
		overflow-y: hidden;
		-ms-overflow-style: none;
		scrollbar-width: none;
		width: 100%;
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
